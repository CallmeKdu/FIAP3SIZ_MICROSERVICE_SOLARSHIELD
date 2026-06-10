import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import esmock from 'esmock';

describe('RN3 - Idempotência no processamento de notificações', () => {
  it('deve descartar mensagens duplicadas com o mesmo event_id garantindo a idempotência', async () => {
    let ackCalled = 0;
    const mockChannel = {
      ack: mock.fn(() => { ackCalled++; }),
      nack: mock.fn(),
    };

    let setCalledCount = 0;
    const mockRedis = {
      set: mock.fn(() => {
        setCalledCount++;
        return Promise.resolve(setCalledCount === 1 ? 'OK' : null);
      }),
      del: mock.fn(),
    };

    const { processNotification } = await esmock('../src/notifier-service/src/services/notificationService.js', {
      '../src/notifier-service/src/integrations/rabbitmqClient.js': {
        getRabbitChannel: () => mockChannel
      },
      '../src/notifier-service/src/integrations/redisClient.js': {
        getRedisClient: () => mockRedis
      }
    });

    const msg = {
      properties: {
        headers: {
          'x-event-id': 'unique-event-id-123'
        }
      },
      content: Buffer.from(JSON.stringify({ alert: 'geomagnetic storm' }))
    };

    // First call
    await processNotification(msg);
    assert.equal(mockRedis.set.mock.callCount(), 1);
    assert.equal(ackCalled, 1);

    // Second call with same event id
    await processNotification(msg);
    assert.equal(mockRedis.set.mock.callCount(), 2);
    assert.equal(ackCalled, 2); // Acked immediately without processing

    // Verify mock channel interactions
    assert.equal(mockChannel.ack.mock.callCount(), 2);
    assert.equal(mockChannel.nack.mock.callCount(), 0);
  });
});
