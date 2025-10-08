// Esto se guardo en un snippet con el comando: micro-envs
//Instalacion de dotenv y joi
//npm i dotenv joi  

import 'dotenv/config';
import Joi, * as joi from 'joi';

//valida que el puerto sea un numero
//Declara las variables y su tipo las cuales se usaran en export const envs

interface EnvVars {
    PORT: number;

    // PRODUCTS_MICROSERVICES_HOST: string;
    // PRODUCTS_MICROSERVICES_PORT: number;

    NATS_SERVERS: string[];
}

// El puerto tiene que ser obligatorio

const envSchema = joi.object({

    PORT: joi.number().required(),

    // PRODUCTS_MICROSERVICES_HOST: joi.string().required(),
    // PRODUCTS_MICROSERVICES_PORT: joi.number().required(),

    NATS_SERVERS: joi.array().items(joi.string()).required(),
})
    .unknown(true);

// desestructura esas variables del .env
const { error, value } = envSchema.validate({
    ...process.env,
    NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
});

//creacion del mensaje de error
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

//cambia tipo de dato de any a number
const envVars: EnvVars = value;

export const envs = {
    port: envVars.PORT,

    // productsMicroservicesHost: envVars.PRODUCTS_MICROSERVICES_HOST,
    // productsMicroservicesPort: envVars.PRODUCTS_MICROSERVICES_PORT,

    natsServers: envVars.NATS_SERVERS,
}