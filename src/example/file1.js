log('-- starting api tests');
let embed = new Embed();
let title = new EmbedTitle();
title.title = "Test embed"
title.url = "https://cascadebot.org/"
embed.title = title;
let author = new EmbedAuthor();
//author.author = "Test"; //user.username;
author.url = "https://example.com"
author.image = user.avatar
embed.author = author;
log(embed.author);
embed.content = "Hi " + user.displayName + " this is a test of embeds"
let footer = new EmbedFooter();
footer.timestamp = new Date();
footer.footer = "This is a footer";
embed.footer = footer;
await replyEmbed(embed);
