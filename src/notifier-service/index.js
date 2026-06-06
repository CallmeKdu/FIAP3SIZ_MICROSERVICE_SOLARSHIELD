import dotenv from 'dotenv';
import { connectRedis } from './src/integrations/redisClient.js';
import { connectRabbitMQ } from './src/integrations/rabbitmqClient.js';
import { startConsumer } from './src/controllers/notificationController.js';

dotenv.config();

const startService = async () => {
    try {
        console.log('Starting Notifier Service...');

        await connectRedis();
        await connectRabbitMQ();

        startConsumer();

        console.log('Notifier Service is up and listening for messages.');
    } catch (error) {
        console.error('Failed to initialize Notifier Service:', error);
        process.exit(1);
    }
};

startService();
