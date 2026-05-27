import { fetchDonkiEvents, fetchHazardousAsteroids } from '../services/spaceWeatherService.js';
import { calculateSeverity } from '../domain/rn1_severity.js';
import { countHazardousAsteroids } from '../domain/rn2_asteroids.js';
import { publishEvent } from '../integrations/rabbitmqClient.js';
import redisClient from '../integrations/redisClient.js';

// Format YYYY-MM-DD
const formatDate = (date) => date.toISOString().split('T')[0];

const processSpaceWeatherEvents = async (startDate, endDate) => {
  const events = await fetchDonkiEvents(startDate, endDate);
  const processedEvents = [];

  for (const event of events) {
    const severityInfo = calculateSeverity(event);

    const payload = {
      event_id: event.gstID || event.messageID,
      startTime: event.startTime,
      severityInfo,
      hazardousAsteroidsCount: 0,
    };

    if (severityInfo.severityLevel === 'severe') {
      const eventDate = new Date(event.startTime);
      const startNeo = new Date(eventDate);
      startNeo.setDate(eventDate.getDate() - 1);
      const endNeo = new Date(eventDate);
      endNeo.setDate(eventDate.getDate() + 1);

      const neoStart = formatDate(startNeo);
      const neoEnd = formatDate(endNeo);

      try {
        const neoResponse = await fetchHazardousAsteroids(neoStart, neoEnd);
        payload.hazardousAsteroidsCount = countHazardousAsteroids(neoResponse);
      } catch (error) {
        console.error(`Error fetching NEO for event ${payload.event_id}`, error.message);
      }
    }
    processedEvents.push(payload);
  }

  // Sort events by startTime descending to easily get the latest one
  processedEvents.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  return processedEvents;
};

export const ingestSpaceWeather = async (req, res) => {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

    const startDate = formatDate(start);
    const endDate = formatDate(end);

    const processedEvents = await processSpaceWeatherEvents(startDate, endDate);

    for (const payload of processedEvents) {
      await publishEvent('space.weather.alert', payload);
    }

    if (processedEvents.length > 0) {
      // Save only the latest event in cache (since they are sorted)
      await redisClient.set(
        'current_space_weather',
        JSON.stringify(processedEvents[0]),
        'EX',
        60
      );
    }

    return res.status(200).json({
      message: 'Ingestion completed successfully.',
      processedCount: processedEvents.length,
      events: processedEvents,
    });
  } catch (error) {
    console.error('Error during ingestion:', error);
    return res.status(500).json({ error: 'Internal Server Error during ingestion' });
  }
};

export const getCurrentSpaceWeather = async (req, res) => {
  try {
    // Cache Aside pattern: check Redis first
    const cachedData = await redisClient.get('current_space_weather');

    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    // Cache miss: fetch the latest data from NASA directly
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

    const startDate = formatDate(start);
    const endDate = formatDate(end);

    const processedEvents = await processSpaceWeatherEvents(startDate, endDate);

    if (processedEvents.length > 0) {
      const latestEvent = processedEvents[0];

      // Update the cache with the latest event
      await redisClient.set(
        'current_space_weather',
        JSON.stringify(latestEvent),
        'EX',
        60
      );

      return res.status(200).json(latestEvent);
    }

    return res.status(404).json({ message: 'No space weather events found.' });

  } catch (error) {
    console.error('Error fetching current space weather:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
