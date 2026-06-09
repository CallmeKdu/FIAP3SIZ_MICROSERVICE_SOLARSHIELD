import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { countHazardousAsteroids } from '../rn2_asteroids.js';

// Testes unitários para a RN2 - Contagem de Asteroides Perigosos (NEO)

describe('countHazardousAsteroids', () => {

  it('deve retornar 0 quando não há asteroides perigosos', () => {
    const feed = {
      near_earth_objects: {
        '2024-05-01': [
          { name: 'Asteroid A', is_potentially_hazardous_asteroid: false },
          { name: 'Asteroid B', is_potentially_hazardous_asteroid: false },
        ],
      },
    };
    const result = countHazardousAsteroids(feed);
    assert.equal(result, 0);
  });

  it('deve contar corretamente os asteroides perigosos em uma única data', () => {
    const feed = {
      near_earth_objects: {
        '2024-05-01': [
          { name: 'Asteroid A', is_potentially_hazardous_asteroid: true },
          { name: 'Asteroid B', is_potentially_hazardous_asteroid: false },
          { name: 'Asteroid C', is_potentially_hazardous_asteroid: true },
        ],
      },
    };
    const result = countHazardousAsteroids(feed);
    assert.equal(result, 2);
  });

  it('deve contar asteroides perigosos em múltiplas datas', () => {
    const feed = {
      near_earth_objects: {
        '2024-05-01': [
          { name: 'Asteroid A', is_potentially_hazardous_asteroid: true },
        ],
        '2024-05-02': [
          { name: 'Asteroid B', is_potentially_hazardous_asteroid: true },
          { name: 'Asteroid C', is_potentially_hazardous_asteroid: false },
        ],
        '2024-05-03': [
          { name: 'Asteroid D', is_potentially_hazardous_asteroid: true },
        ],
      },
    };
    const result = countHazardousAsteroids(feed);
    assert.equal(result, 3);
  });

  it('deve retornar 0 quando near_earth_objects está vazio', () => {
    const feed = { near_earth_objects: {} };
    const result = countHazardousAsteroids(feed);
    assert.equal(result, 0);
  });

  it('deve retornar 0 quando o response é null', () => {
    const result = countHazardousAsteroids(null);
    assert.equal(result, 0);
  });

  it('deve retornar 0 quando o response é undefined', () => {
    const result = countHazardousAsteroids(undefined);
    assert.equal(result, 0);
  });

  it('deve retornar 0 quando near_earth_objects não existe no response', () => {
    const result = countHazardousAsteroids({});
    assert.equal(result, 0);
  });

  it('deve ignorar entradas que não são arrays dentro de near_earth_objects', () => {
    const feed = {
      near_earth_objects: {
        '2024-05-01': null,
        '2024-05-02': [
          { name: 'Asteroid A', is_potentially_hazardous_asteroid: true },
        ],
      },
    };
    const result = countHazardousAsteroids(feed);
    assert.equal(result, 1);
  });
});
