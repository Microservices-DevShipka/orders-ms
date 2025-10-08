import { Module } from '@nestjs/common';

import { OrdersModule } from './orders/orders.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs, PRODUCTS_SERVICE } from './config';
import { NatsModule } from './transports/nats.module';

@Module({
  
  controllers: [],
  providers: [],
  imports: [OrdersModule, NatsModule
  ],

})
export class AppModule { }
