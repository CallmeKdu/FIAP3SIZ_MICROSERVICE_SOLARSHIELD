import { getRabbitChannel } from '../integrations/rabbitmqClient.js';
import { processNotification } from '../services/notificationService.js';

export const startConsumer = () => {
    const channel = getRabbitChannel();
    const queue = 'notifier.alerts';

    console.log(`Starting consumer on queue: ${queue}`);

    channel.consume(queue, async (msg) => {
        if (msg) {
            await processNotification(msg);
        }
    }, { noAck: false });
};
