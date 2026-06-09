import { jest } from '@jest/globals';

// Mock dependências
const mockRedisClientInstance = {
    set: jest.fn(),
    del: jest.fn(),
};

jest.unstable_mockModule('../src/notifier-service/src/integrations/redisClient.js', () => ({
    getRedisClient: jest.fn(() => mockRedisClientInstance),
}));

const mockRabbitChannelInstance = {
    ack: jest.fn(),
    nack: jest.fn(),
};

jest.unstable_mockModule('../src/notifier-service/src/integrations/rabbitmqClient.js', () => ({
    getRabbitChannel: jest.fn(() => mockRabbitChannelInstance),
}));

const { processNotification } = await import('../src/notifier-service/src/services/notificationService.js');

describe('RN3_Idempotencia - Notifier Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Evita poluir o terminal de testes
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should process the message and ack if it is the first time (idempotency key not in Redis)', async () => {
        const msg = {
            properties: { headers: { 'x-event-id': 'unique-event-id-123' } },
            content: Buffer.from(JSON.stringify({ some: 'data' }))
        };

        // Simula a chave não existindo
        mockRedisClientInstance.set.mockResolvedValueOnce('OK');

        await processNotification(msg);

        expect(mockRedisClientInstance.set).toHaveBeenCalledWith(
            'idem:notifier:unique-event-id-123', 1, 'NX', 'EX', 86400
        );
        expect(mockRabbitChannelInstance.ack).toHaveBeenCalledWith(msg);
        expect(mockRabbitChannelInstance.nack).not.toHaveBeenCalled();
    });

    it('should discard the message and ack if it is a duplicate (idempotency key already in Redis)', async () => {
        const msg = {
            properties: { headers: { 'x-event-id': 'duplicate-event-id-456' } },
            content: Buffer.from(JSON.stringify({ some: 'data' }))
        };

        // Simula a chave já existindo
        mockRedisClientInstance.set.mockResolvedValueOnce(null);

        await processNotification(msg);

        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Duplicate message detected'));
        expect(mockRabbitChannelInstance.ack).toHaveBeenCalledWith(msg);
        expect(mockRabbitChannelInstance.nack).not.toHaveBeenCalled();
    });

    it('should nack and discard message if neither x-event-id nor messageId is present', async () => {
        const msg = {
            properties: {},
            content: Buffer.from(JSON.stringify({ some: 'data' }))
        };

        await processNotification(msg);

        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Discarding message'));
        expect(mockRabbitChannelInstance.nack).toHaveBeenCalledWith(msg, false, false);
        expect(mockRabbitChannelInstance.ack).not.toHaveBeenCalled();
    });
});
