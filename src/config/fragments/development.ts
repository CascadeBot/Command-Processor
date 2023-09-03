import { Config } from '@config/parts';
import { PartialDeep } from 'type-fest';

export const developmentFragment: PartialDeep<Config> = {
  logging: {
    format: 'pretty',
    allowScripts: true,
  },
};
