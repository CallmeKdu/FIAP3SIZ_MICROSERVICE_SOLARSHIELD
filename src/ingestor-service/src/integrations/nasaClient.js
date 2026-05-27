import axios from 'axios';
import axiosRetry from 'axios-retry';

const nasaClient = axios.create({
  baseURL: 'https://api.nasa.gov',
});

// Add API Key to all requests
nasaClient.interceptors.request.use((config) => {
  config.params = config.params || {};
  config.params.api_key = process.env.NASA_API_KEY || 'DEMO_KEY';
  return config;
});

// Configure retry with exponential backoff
axiosRetry(nasaClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    // Retry on 429 (Too Many Requests) or 5xx (Server Errors)
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      (error.response && error.response.status === 429) ||
      (error.response && error.response.status >= 500)
    );
  },
});

export default nasaClient;
