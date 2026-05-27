import 'dotenv/config';
import express from 'express';
import { connectRabbitMQ } from './src/integrations/rabbitmqClient.js';
import spaceWeatherRoutes from './src/routes/spaceWeatherRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/space-weather', spaceWeatherRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const startServer = async () => {
  await connectRabbitMQ();

  app.listen(PORT, () => {
    console.log(`Ingestor Service running on port ${PORT}`);
  });
};

startServer();
