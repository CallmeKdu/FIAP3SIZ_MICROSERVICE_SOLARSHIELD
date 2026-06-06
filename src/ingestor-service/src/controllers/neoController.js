import { fetchHazardousAsteroids } from '../services/spaceWeatherService.js';

export const getNeoFeed = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    const neoResponse = await fetchHazardousAsteroids(start_date, end_date);
    return res.status(200).json(neoResponse);
  } catch (error) {
    console.error('Error in GET /api/neo/feed:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
