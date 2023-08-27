async function reply(message) {
  await __cascadeApi({
    action: 'reply',
    data: {
      message: message,
      // TODO I don't know if this works if we ingest the interaction id and guild into global
      guildId: guildId,
      interactionId: interactionId
    }
  });
}

return {
  reply
}