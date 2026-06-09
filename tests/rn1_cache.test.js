import { jest } from '@jest/globals';

// Mock dependências
jest.unstable_mockModule('../src/ingestor-service/src/integrations/redisClient.js', () => ({
  default: {
    get: jest.fn(),
    set: jest.fn(),
    on: jest.fn(),
  }
}));

jest.unstable_mockModule('../src/ingestor-service/src/integrations/rabbitmqClient.js', () => ({
  publishEvent: jest.fn(),
}));

jest.unstable_mockModule('../src/ingestor-service/src/integrations/nasaClient.js', () => ({
  default: {
    get: jest.fn(),
  }
}));

// Importa os mocks para usar nos testes
const mockNasaClient = (await import('../src/ingestor-service/src/integrations/nasaClient.js')).default;
const mockRedis = (await import('../src/ingestor-service/src/integrations/redisClient.js')).default;

// Importa o módulo a ser testado APÓS mockar as dependências
const { getCurrentSpaceWeather } = await import('../src/ingestor-service/src/controllers/spaceWeatherController.js');

describe('RN1_Cache - Ingestor Service', () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {};
    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should return HIT and cached data when data is available in Redis', async () => {
    const cachedData = {
      event_id: 'mock-gst-id',
      start_time: '2024-01-01T00:00:00Z',
      severity_info: { kp_index: 8, severity_level: 'severe', emergency_notification: true },
      hazardous_asteroids_count: 5
    };

    mockRedis.get.mockResolvedValueOnce(JSON.stringify(cachedData));

    await getCurrentSpaceWeather(req, res);

    expect(mockRedis.get).toHaveBeenCalledWith('current_space_weather');
    expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(cachedData);
  });

  it('should return MISS, fetch data from NASA, extract highest Kp index and cache it', async () => {
    mockRedis.get.mockResolvedValueOnce(null); // No cache

    // Mock response for DONKI/notifications e NEO feed
    mockNasaClient.get.mockImplementation((url, config) => {
      if (url === '/DONKI/notifications') {
        return Promise.resolve({
          data: [
            {
              messageID: 'event1',
              messageType: 'GST',
              messageIssueTime: '2024-01-01T00:00:00Z',
              messageBody: 'Message ID: gst-001\nIssue Time: 2024-01-01T00:00:00Z\nKp=5\nKp index: 8.5\nKp: 7'
            }
          ]
        });
      }
      if (url === '/neo/rest/v1/feed') {
        return Promise.resolve({
          data: {
            near_earth_objects: {
              '2024-01-01': [{ is_potentially_hazardous_asteroid: true }, { is_potentially_hazardous_asteroid: false }]
            }
          }
        });
      }
      return Promise.reject(new Error('URL not mocked'));
    });

    await getCurrentSpaceWeather(req, res);

    expect(mockRedis.get).toHaveBeenCalledWith('current_space_weather');
    expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
    expect(mockRedis.set).toHaveBeenCalledTimes(1);

    const setCallArgs = mockRedis.set.mock.calls[0];
    expect(setCallArgs[0]).toBe('current_space_weather');
    const savedData = JSON.parse(setCallArgs[1]);
    expect(savedData.event_id).toBe('gst-001');
    expect(savedData.severity_info.kp_index).toBe(8.5);
    expect(savedData.severity_info.severity_level).toBe('severe');
    expect(savedData.hazardous_asteroids_count).toBe(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(savedData);
  });
});
