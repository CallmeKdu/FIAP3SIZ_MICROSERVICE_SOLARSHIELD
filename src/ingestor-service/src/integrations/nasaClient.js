import axios from 'axios';
import axiosRetry from 'axios-retry';
import { v4 as uuidv4 } from 'uuid';

const nasaClient = axios.create({
  baseURL: 'https://api.nasa.gov',
  timeout: 5000,
});

// Add API Key to all requests and generate correlation ID
nasaClient.interceptors.request.use((config) => {
  config.params = config.params || {};
  config.params.api_key = process.env.NASA_API_KEY || 'DEMO_KEY';
  config.headers = config.headers || {};
  config.headers['x-correlation-id'] = uuidv4();
  return config;
});

// Configure retry with exponential backoff
axiosRetry(nasaClient, {
  retries: 3,
  retryDelay: (retryCount) => 500 * Math.pow(2, retryCount - 1),
  retryCondition: (error) => {
    // Retry on 429 (Too Many Requests) or 5xx (Server Errors)
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response && error.response.status === 429) ||
      (error.response && error.response.status >= 500)
    );
  },
  onRetry: (retryCount, error, requestConfig) => {
    const correlationId = requestConfig.headers['x-correlation-id'] || 'unknown';
    console.error(`[Correlation ID: ${correlationId}] Retry attempt ${retryCount} for request to ${requestConfig.url}. Error: ${error.message}`);
  }
});

export default nasaClient;
