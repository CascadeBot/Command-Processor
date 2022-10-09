function hello() {
  return 'world';
}

async function ping(reply) {
  const res = await __cascadeApi({
    action: 'ping',
    data: {
      msg: reply ?? undefined,
    },
  });
  if (!res.success) throw new Error(res.error);
  return res.data;
}

return {
  hello,
  ping,
};
