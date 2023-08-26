import { Channel, connect, Connection, ConsumeMessage, Replies } from 'amqplib';
import { config } from '@config';
import { randomUUID } from 'crypto';
import { scopedLogger } from '@logger';
import AssertQueue = Replies.AssertQueue;
import { ScriptInfo } from '@models/script-info';

const log = scopedLogger('rabbitmq-manager');

let connection: Connection;
let channel: Channel;

const waitForReplies: QueueConsumer[] = [];

let replyQueue: AssertQueue;
let processQueue: AssertQueue;

export const MetaRoutingKey = 'meta';

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

  replyQueue = await channel.assertQueue('', {
    exclusive: true,
    autoDelete: true,
  });

  processQueue = await channel.assertQueue('custom_command', {});

  channel.consume(replyQueue.queue, replyConsume).catch((e) => {
    log.error(e);
  });

  channel.consume(processQueue.queue, processConsume).catch((e) => {
    log.error(e);
  });
}

export async function getShardCount() {
  const res = await sendMessageGetReply<ShardCount>('shard_count');
  const code = res.status_code;
  const shards = res.data.shard_count;

  log.info(`code: ${code}, shard: ${shards}`);

  return shards; // TODO store shard count
}

function processConsume(message: ConsumeMessage | null) {
  const json = JSON.parse(message.content.toString()) as CommandRequest;
  // TODO send to command processor
}

function replyConsume(message: ConsumeMessage | null) {
  const reply = waitForReplies.find((consumer) => {
    return consumer.correlationId == message.properties.correlationId;
  });
  channel.ack(message);
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

type ScriptLang = 'JS' | 'TEXT';

interface CommandRequest {
  lang: ScriptLang;
  entrypoint: string;
  files: ScriptInfo;
  options: Record<string, CommandOption[]>;
  member: Member;
  channel: DiscordChannel;
  interactionId: string;
}

interface Member {
  id: string;
  name: string;
  avatarUrl: string;
  nickname: string | null;
  discriminator: string | null;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: string;
  position: number;
}

interface CommandOption {
  type: string;
  value: number | string;
}

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
  body: Record<string, any> = {},
  exchangeName = 'amq.direct',
  routingKey = MetaRoutingKey,
): Promise<Response<T>> {
  const id = randomUUID();
  const prom = new Promise<Response<T>>((resolve, reject) => {
    waitForReplies.push({
      correlationId: id,
      resolve,
      reject,
    });
  });
  channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(body)), {
    correlationId: id,
    replyTo: replyQueue.queue,
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
