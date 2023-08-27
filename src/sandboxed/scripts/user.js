class User {
  #backingId = "0";

  name = "";
  nick = "";
  avatar = "";
  discriminator = "";

  constructor(data) {
    this.#backingId = data.id;
    this.name = data.name;
    this.nick = data.nickname;
    this.avatar = data.avatarUrl;
    this.discriminator = data.discriminator;
  }

}

async function getUserByID(id) {
  let data = await __cascadeApi({

  });
}

return {
  User,
  getUserByID
}
