import amqp from 'amqplib';

let connection = null;
let channel = null;

export const connectRabbitMQ = async () => {
    try {
        const url = process.env.RABBITMQ_URL || 'amqp://localhost';
        connection = await amqp.connect(url);
        channel = await connection.createChannel();

        const exchange = 'space.events';
        const queue = 'notifier.alerts';
        const routingKey = 'space.weather.alert';

        await channel.assertExchange(exchange, 'topic', { durable: true });
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, routingKey);

        await channel.prefetch(10);

        console.log('RabbitMQ connected and configured successfully.');
        return channel;
    } catch (error) {
        console.error('RabbitMQ connection error:', error);
        throw error;
    }
};

export const getRabbitChannel = () => {
    if (!channel) {
        throw new Error('RabbitMQ channel not initialized. Call connectRabbitMQ first.');
    }
    return channel;
};
