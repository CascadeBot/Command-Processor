class Message {

}

const messageType = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  DANGER: 'DANGER',
  WARNING: 'WARNING',
  NEUTRAL: 'NEUTRAL'
}

class Embed {
  title = undefined; // EmbedTitle | undefined
  content = undefined;
  fields  = undefined; // EmbedField[] | undefined
  author = undefined; // EmbedAuthor | undefined
  footer = undefined; // EmbedFooter | undefined
  thumbnail = undefined;
  image = undefined;
  color = undefined; // Color | messageType | undefined

  constructor(data) {
    if (!data) {
      return;
    }
    // We can ignore the url if title isn't defined as it does nothing, not sure why discord doesn't have a bug object for that like everything else
    // I'm trying to be nicer to the users which is why I put it in a sub object
    if (data.title) {
      this.title = new EmbedTitle(data.title, data.url);
    }
    this.content = data.content;
    if (data.fields) {
      this.fields = [];
      for (const field of data.fields) {
        this.fields.push(new EmbedField(field));
      }
    }
    if (data.author) {
      this.author = new EmbedAuthor(data.author);
    }
    // Once again trying to be nice to the user, as timestamp is displayed in the footer I'm adding it to the footer obj
    if (data.footer || data.timestamp) {
      this.footer = new EmbedFooter(data.footer, data.timestamp);
    }
    this.thumbnail = data.thumbnail;
    this.image = data.image;
    if (data.color) {
      this.color = new Color(data.color);
    }
    if (data.message_type) {
      this.color = data.message_type;
    }
  }

  setTitleString(title) {
    if (!(this.title instanceof EmbedTitle)) {
      this.title = new EmbedTitle();
    }
    this.title.title = title;
    return this;
  }

  setAuthorName(author) {
    if (!(this.author instanceof EmbedAuthor)) {
      this.author = new EmbedAuthor();
    }
    this.author.author = author;
    return this;
  }

  setFooterText(footer) {
    if (!(this.footer instanceof EmbedFooter)) {
      this.footer = new EmbedFooter();
    }
    this.footer.footer = footer;
    return this;
  }

  setFooterTimestamp(date) {
    if (!(this.footer instanceof EmbedFooter)) {
      this.footer = new EmbedFooter();
    }
    this.footer.timestamp = date;
    return this;
  }
}

class EmbedField {
  inline = true;
  title = '';
  content = '';

  constructor(data) {
    if (!data) {
      return;
    }
    this.inline = data.inline;
    this.title = data.name;
    this.content = data.value;
  }
}

class EmbedAuthor {
  author = '';
  url = undefined;
  image = undefined;

  constructor(data) {
    if (!data) {
      return;
    }
    this.author = data.name;
    this.url = data.icon_url;
    this.image = data.image;
  }
}

class EmbedTitle {
  title = '';
  url = undefined;

  constructor(title, url) {
    this.title = title;
    this.url = url;
  }
}

class EmbedFooter {
  footer = '';
  iconUrl = undefined;
  timestamp = undefined; // Date | undefined

  constructor(data, timestamp) {
    if (data) {
      this.footer = data.text;
      this.iconUrl = data.icon_url;
    }
    if (timestamp) {
      this.timestamp = timestamp;
    }
  }
}

let replyCalled = false;

async function reply(message) {
  if (replyCalled) {
    // TODO batter errors
    throw new Error("Cannot call reply more then once, if you wish to send another message do channel.sendMessage(), if you wish to edit the reply message use the editMessage() function");
  }
  await __cascadeApi({
    action: 'reply',
    data: {
      message: message,
      guildId: guildId,
      interactionId: interactionId
    }
  });
  replyCalled = true;
}

async function replyEmbed(embed) {
  if (replyCalled) {
    // TODO batter errors
    throw new Error("Cannot call reply more then once, if you wish to send another message do channel.sendMessage(), if you wish to edit the reply message use the editMessage() function");
  }
  await __cascadeApi({
    action: 'replyEmbed',
    data: {
      embed: embed,
      guildId: guildId,
      interactionId: interactionId
    }
  });
  replyCalled = true;
}

return {
  Message,
  Embed,
  EmbedField,
  EmbedAuthor,
  EmbedTitle,
  EmbedFooter,
  messageType,
  reply,
  replyEmbed
}
