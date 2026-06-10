import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:8080';

export const options = {
  vus: 10,
  duration: '10s',
};

export default function () {
  const urlPost = `${BASE_URL}/api/space-weather/ingest`;
  const payload = JSON.stringify({});
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const resPost = http.post(urlPost, payload, params);

  const urlGet = `${BASE_URL}/api/space-weather/current`;
  const resGet = http.get(urlGet);

  check(resPost, {
    'POST is status 202': (r) => r.status === 202,
  });

  check(resGet, {
    'GET is status 200': (r) => r.status === 200,
  });

  sleep(1);
}
