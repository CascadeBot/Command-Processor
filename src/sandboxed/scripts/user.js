class User {
  #backingId = "0";

  username = "";
  nick = "";
  displayName = "";
  avatar = "";
  discriminator = "";

  constructor(data) {
    this.#backingId = data.id;
    this.username = data.username;
    this.displayName = data.display_name
    this.nick = data.nickname;
    this.avatar = data.avatarUrl;
    this.discriminator = data.discriminator;
  }

  getAsMention() {
    return '<@' + this.#backingId + '>'
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
