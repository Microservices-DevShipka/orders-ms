import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NATS_SERVICE, envs } from 'src/config';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: NATS_SERVICE,
                transport: Transport.NATS, //tiene que ser el mismo transporte que el main del microservicio TCP. RabitMQ, gRPC, etc
                options: {
                    servers: envs.natsServers,
                }
            },
        ]),
    ],

    exports: [
        ClientsModule.register([
            {
                name: NATS_SERVICE,
                transport: Transport.NATS, //tiene que ser el mismo transporte que el main del microservicio TCP. RabitMQ, gRPC, etc
                options: {
                    servers: envs.natsServers,
                }
            },
        ]),
    ]
})
export class NatsModule { }
