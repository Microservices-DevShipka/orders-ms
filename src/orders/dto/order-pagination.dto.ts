import { IsEnum, IsOptional } from "class-validator";
import { PaginationDTO } from "src/common/dto";
import { OrderStatusList } from "../enum/order.enum";
import { OrderStatus } from '@prisma/client';



export class OrderPaginationDTO extends PaginationDTO{

    @IsOptional()
    @IsEnum( OrderStatusList,{
        message: `Valid status are: ${ OrderStatusList }`
    })
    status: OrderStatus;
}