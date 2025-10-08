import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PaginationDTO } from 'src/common/dto';
import { OrderPaginationDTO } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto, OrderItemDto } from './dto';
import { NATS_SERVICE, PRODUCTS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('OrdersService');

  constructor(@Inject(NATS_SERVICE) private readonly natsClient: ClientProxy) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Conected to the database...');
  }

  async create(createOrderDto: CreateOrderDto) {

    try {

      //1) Validar que los productos existan
      const productsIds = createOrderDto.items.map(item => item.productId);
      const products: any[] = await firstValueFrom(
        this.natsClient.send({ cmd: 'validate_products' }, productsIds)
      );

      //2) Calculo de los valores
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {

        const price = products.find(
          (product) => product.id === orderItem.productId
        ).price;

        return price * orderItem.quantity //+ acc;

      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, item) => acc + item.quantity, 0);

      //3) Crear una transacción de DB
      const order = await this.order.create({
        //data → Son los datos que quieres guardar en la tabla Order.
        data: {
          totalAmount: totalAmount,   // Monto total de la orden
          totalItems: totalItems,     // Número total de items en la orden
          OrderItem: {                // Relación con la tabla OrderItem
            createMany: {             // Crear muchos registros de golpe
              data: createOrderDto.items.map((orderItem) => ({
                price: products.find(
                  (product) => product.id === orderItem.productId)
                  .price,
                productId: orderItem.productId,
                quantity: orderItem.quantity,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            }
          }
        }
      });


      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId)
            .name
        })),
      };

    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }



    // return this.order.create({
    //   data: createOrderDto
    // });
  }

  async findAll(orderPaginationDTO: OrderPaginationDTO) {

    const { page = 1, limit = 10, status } = orderPaginationDTO;

    const totalPages = await this.order.count({
      where: {
        status: orderPaginationDTO.status
      }
    });

    const perPage = Math.max(1, Math.ceil(totalPages / limit));
    const currentPage = Math.min(page, perPage); // evita que se pase del límite




    return {
      data: await this.order.findMany({

        skip: (currentPage - 1) * limit,
        take: limit,
        where: {
          status: orderPaginationDTO.status
        },
      }),
      meta: {
        totalPages: totalPages,
        page: currentPage,
        lastPage: perPage
      }
    }
  }



  async findOne(id: string) {

    const order = await this.order.findFirst({
      where: { id: id },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          }
        }
      }
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    //De primera no aparece OrderItem, por lo que hay que incluirlo en la linea 140 con el include
    //Luego, no aparece el name del producto, por lo que hay que ir a buscarlo al microservicio de productos
    //1) Obtener los IDs de los productos
    //2) Hacer la petición al microservicio de productos
    //3) Mapear el resultado
    const productsIds = order.OrderItem.map(orderItem => orderItem.productId);
    const products: any[] = await firstValueFrom(
      this.natsClient.send({ cmd: 'validate_products' }, productsIds)
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        name: products.find((product) => product.id === orderItem.productId)
          .name
      })),
    }
  }

  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {

    const { id, status } = changeOrderStatusDto;

    const order = await this.findOne(id);

    if (order.status === status) {
      return order;
    }

    return this.order.update({
      where: { id },
      data: {
        status: status
      }
    })

  }
}
