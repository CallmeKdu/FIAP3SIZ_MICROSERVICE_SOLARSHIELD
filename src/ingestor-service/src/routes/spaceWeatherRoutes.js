import express from 'express';
import { ingestSpaceWeather, getCurrentSpaceWeather } from '../controllers/spaceWeatherController.js';

const router = express.Router();

router.post('/ingest', ingestSpaceWeather);
router.get('/current', getCurrentSpaceWeather);

export default router;
