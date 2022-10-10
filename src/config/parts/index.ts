import joi from 'joi';
import { LoggingConf, loggingConfSchema } from './logging';
import { RabbitMQConf, rabbitMqConfSchema } from '@config/parts/rabbitMQ';

export interface Config {
  logging: LoggingConf;
  rabbitMq: RabbitMQConf;
}

export const configSchema = joi.object<Config>({
  logging: loggingConfSchema.default(),
  rabbitMq: rabbitMqConfSchema,
});
