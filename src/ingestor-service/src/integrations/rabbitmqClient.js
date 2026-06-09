import amqp from 'amqplib';
import { randomUUID } from 'node:crypto';

let channel = null;

export const connectRabbitMQ = async () => {
  try {
    const rabbitMqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const connection = await amqp.connect(rabbitMqUrl);
    channel = await connection.createChannel();

    // Assert the exchange space.events as topic
    await channel.assertExchange('space.events', 'topic', { durable: true });

    console.log('Connected to RabbitMQ and asserted exchange: space.events');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
};

export const publishEvent = async (routingKey, message) => {
  if (!channel) {
    console.error('RabbitMQ channel not initialized');
    return false;
  }

  try {
    const messageId = randomUUID();
    channel.publish(
      'space.events',
      routingKey,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
        messageId: messageId,
        contentType: 'application/json',
        headers: { 'x-event-id': messageId }
      }
    );
    return true;
  } catch (error) {
    console.error('Failed to publish message:', error);
    return false;
  }
};
