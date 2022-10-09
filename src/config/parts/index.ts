import joi from 'joi';
import { LoggingConf, loggingConfSchema } from './logging';
export interface Config {
  logging: LoggingConf;
}

export const configSchema = joi.object<Config>({
  logging: loggingConfSchema.default(),
});
