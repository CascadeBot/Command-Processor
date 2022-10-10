import { connect, ConsumeMessage } from 'amqplib';
import { config } from '@config';
import { randomUUID } from 'crypto';
import { scopedLogger } from '@logger';
import { string } from 'joi';

const log = scopedLogger('rabbitmq-manager');

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

  queue = await channel.assertQueue('', {
    exclusive: true,
    autoDelete: true,
  });

  channel.consume(queue.queue, consume).catch((e) => {
    log.error(e);
  });
}

export async function getShardCount() {
  const res = await sendMessageGetReply<ShardCount>('shard_count', {});
  const code = res.status_code;
  const shards = res.data.shard_count;

  log.info(`code: ${code}, shard: ${shards}`);
}

function consume(message: ConsumeMessage | null) {
  const reply = waitForReplies.find((consumer) => {
    return consumer.correlationId == message.properties.correlationId;
  });
  const json = JSON.parse(message.content.toString()) as Response<any>;
  if (json.error) {
    reply.reject(json);
    return;
  }
  reply.resolve(json);
  deleteWait(message.properties.correlationId);
}

function deleteWait(id: string): boolean {
  let deleted = false;
  waitForReplies.filter((wait) => {
    deleted = true;
    return wait.correlationId != id;
  });
  return deleted;
}

interface ResponseErrorSub {
  error_code: string;
  message: string;
}

export type Response<T> = ResponseSuccess<T> | ResponseError;

interface ResponseSuccess<T> {
  status_code: number;
  error: undefined;
  data: T;
}

interface ResponseError {
  status_code: number;
  error: ResponseErrorSub;
  data: undefined;
}

interface ShardCount {
  shard_count: number;
}

export async function sendMessageGetReply<T>(
  action: string,
  body: Record<string, any>,
  queueName = '',
): Promise<Response<T>> {
  const id = randomUUID();
  const prom = new Promise<Response<T>>((resolve, reject) => {
    waitForReplies.push({
      correlationId: id,
      resolve,
      reject,
    });
  });
  await channel.publish(queueName, 'meta', Buffer.from(JSON.stringify(body)), {
    correlationId: id,
    replyTo: queue.queue,
    headers: {
      action: action,
    },
  });

  setTimeout(() => {
    const wait = waitForReplies.find((consumer) => {
      return consumer.correlationId == id;
    });
    if (wait == undefined) {
      return;
    }
    wait.reject(new Error('Timeout elapsed'));
    deleteWait(id);
  }, 5000);

  return await prom;
}
