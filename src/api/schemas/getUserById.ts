import joi from 'joi';

export const action = 'getUserById';

interface GetUserById {
  userId: string;
  guildId: string;
}

export const schema = joi.object<GetUserById>({
  userId: joi.string().regex(/\d{18,}/),
  guildId: joi.string().regex(/\d{18,}/),
});

export const run = (data: GetUserById) => {
  return 'NO';
};
