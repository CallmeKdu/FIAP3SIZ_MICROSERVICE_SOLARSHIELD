import { getRedisClient } from '../integrations/redisClient.js';
import { getRabbitChannel } from '../integrations/rabbitmqClient.js';

export const processNotification = async (msg) => {
    const channel = getRabbitChannel();
    const redisClient = getRedisClient();

    const eventId = msg.properties.headers?.['x-event-id'] || msg.properties.messageId;

    if (!eventId) {
        console.warn('Message received without x-event-id or messageId. Discarding message.');
        channel.nack(msg, false, false);
        return;
    }

    const redisKey = `idem:notifier:${eventId}`;

    try {
        const result = await redisClient.set(redisKey, 1, 'NX', 'EX', 86400);

        if (!result) {
            console.warn(`Duplicate message detected for event ID: ${eventId}. Ignoring and acking.`);
            channel.ack(msg);
            return;
        }

        const payload = JSON.parse(msg.content.toString());

        console.log('--- SPACE WEATHER ALERT ---');
        console.log(`Alert for event: ${eventId}`);
        console.log(`Payload data:`, payload);
        console.log('---------------------------');

        channel.ack(msg);
    } catch (error) {
        console.error('Error processing notification:', error);
        await redisClient.del(redisKey).catch(e => console.error('Failed to delete key after error:', e));
        channel.nack(msg, false, false);
    }
};
