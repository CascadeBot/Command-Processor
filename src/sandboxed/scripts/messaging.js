class Message {

}

class Embed {
  title: EmbedTitle|null = null;
  content = null;
  fields: EmbedField[]|null = null;
  author: EmbedAuthor|null = null;
  provider: EmbedProvider|null = null;
  footer: EmbedFooter|null = null;
  thumbnail = null;
  image = null;
  color: Color|null = null;
}

class EmbedField {
  inline = true;
  title = '';
  content = '';
}

class EmbedAuthor {
  author = ''
  url = null
  image = null
}

class EmbedTitle {
  title = '';
  url = null;
}

class EmbedFooter {
  footer = '';
  url = null;
  timestamp = new Date();
}

class EmbedProvider {
  provider = '';
  url = null;
}

async function reply(message) {
  await __cascadeApi({
    action: 'reply',
    data: {
      message: message,
      guildId: guildId,
      interactionId: interactionId
    }
  });
}

async function replyEmbed(embed) {

}

return {
  Message,
  Embed,
  EmbedField,
  EmbedAuthor,
  EmbedTitle,
  EmbedFooter,
  EmbedProvider,
  reply,
  replyEmbed
}
