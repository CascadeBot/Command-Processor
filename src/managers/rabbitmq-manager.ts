import { connect, ConsumeMessage } from 'amqplib';
import { config } from '@config';
import { randomUUID } from 'crypto';
import { scopedLogger } from '@logger';

const log = scopedLogger('manager');

let connection;
let channel;

const waitForReplies: QueueConsumer[] = [];

let queue;

interface QueueConsumer {
  correlationId: string;
  resolve: (...args: any[]) => void;
  reject: (...args: any[]) => void;
}

export async function tryConnect() {
  let connectionString: string;
  if (config.rabbitMq.type == 'individual') {
    connectionString = `amqp://${config.rabbitMq.username}:${encodeURIComponent(
      config.rabbitMq.password,
    )}@${config.rabbitMq.hostname}:${config.rabbitMq.port}${
      config.rabbitMq.virtualHost
    }`;
  } else {
    connectionString = config.rabbitMq.connectionString;
  }

  connection = await connect(connectionString);
  channel = await connection.createChannel();

  queue = await channel.assertQueue('');

  channel.consume(queue, consume).catch((e) => {
    log.error(e);
  });
}

export async function getShardCount() {
  const res = await sendMessageGetReply();
  const code = res.statusCode;
  const shards = res.data['shard-count'];

  log.info(`code: ${code}, chard: ${shards}`);
}

function consume(message: ConsumeMessage | null) {
  const reply = waitForReplies.find((consumer) => {
    return consumer.correlationId == message.properties.correlationId;
  });
  const json = JSON.parse(message.content.toString());
  reply.resolve(json);
}

async function sendMessageGetReply(): Promise<any> {
  const id = randomUUID();
  const prom = new Promise((resolve, reject) => {
    waitForReplies.push({
      correlationId: id,
      resolve,
      reject,
    });
  });
  await channel.publish('', 'meta', Buffer.from(''), {
    correlationId: id,
    replyTo: queue.queue,
    headers: {
      action: 'shard-count',
    },
  });
  return await prom;
}
