import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import esmock from 'esmock';

describe('RN3 - Idempotência e validação de formato', () => {
  it('deve descartar a mensagem e dar nack(requeue=false) caso venha sem eventId ou messageId', async () => {
    let nackCalled = 0;
    const mockChannel = {
      ack: mock.fn(),
      nack: mock.fn(() => { nackCalled++; }),
    };

    const mockRedis = {
      set: mock.fn(),
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
        // Sem headers nem messageId
      },
      content: Buffer.from(JSON.stringify({ alert: 'geomagnetic storm' }))
    };

    await processNotification(msg);

    // O redis nem deve ser chamado
    assert.equal(mockRedis.set.mock.callCount(), 0);

    // Nack deve ser chamado com requeue=false
    assert.equal(nackCalled, 1);
    const nackArgs = mockChannel.nack.mock.calls[0].arguments;
    assert.equal(nackArgs[1], false); // allUpTo
    assert.equal(nackArgs[2], false); // requeue
  });
});
