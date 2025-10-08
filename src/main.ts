import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config/envs';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { env } from 'process';

async function bootstrap() {

  const logger = new Logger('Orders-MS');

  // Create the microservice
  /*  Para covertir la app en un microservicio se instala el paquete @nestjs/microservices
      npm install @nestjs/microservices
  
      Luego
  se cambia NestFactory.create por NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      transport : Transport.TCP,
      options : {
        port: envs.port
      }
    });
  */
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule,
    {
      transport: Transport.NATS, // Usamos NATS como transporte
      options:{
        servers: [process.env.NATS_SERVERS || 'nats://localhost:4222'] //aqui debe ir env.natsServers
      }
    }
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );


  await app.listen();
  logger.log('Orders Microservice running on port: ' + envs.port);
}
bootstrap();
