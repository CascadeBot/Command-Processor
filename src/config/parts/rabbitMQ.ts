import joi from 'joi';

interface RabbitMQIndividualConf {
  username: string;
  password: string;
  hostname: string;
  port: number; // = 5672
  virtualHost: string; // = "/"
  type: 'individual';
}

interface RabbitMQConnectionStringConfig {
  connectionString: string;
  type: 'connectionString';
}

export type RabbitMQConf =
  | RabbitMQIndividualConf
  | RabbitMQConnectionStringConfig;

export const rabbitMqConfSchema = joi
  .alternatives()
  .try(
    joi.object({
      username: joi.string().required(),
      password: joi.string().required(),
      hostname: joi.string().hostname().required(),
      port: joi.number().default(5672),
      virtualHost: joi
        .string()
        .regex(/(\/.*)*\/?/)
        .default('/'),
      type: joi.string().default('individual').valid('individual'),
    }),
    joi.object({
      connectionString: joi.string().uri({
        scheme: 'amqp',
      }),
      type: joi.string().default('connectionString').valid('connectionString'),
    }),
  )
  .match('one');
