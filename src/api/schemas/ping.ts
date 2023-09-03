import joi from 'joi';

export const action = 'ping';

interface Input {
  msg: string;
}

export const schema = joi.object<Input>({
  msg: joi.string().default('pong!'),
});

export const run = async (_data: Input) => {
  throw new Error('test');
};
