import joi from 'joi';

export interface LoggingConf {
  format: 'json' | 'pretty';
  allowScripts: boolean;
}

export const loggingConfSchema = joi.object({
  format: joi.string().valid('json', 'pretty').default('json'),
  allowScripts: joi.boolean().default(false),
});
