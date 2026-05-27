export const countHazardousAsteroids = (neoFeedResponse) => {
  if (!neoFeedResponse || !neoFeedResponse.near_earth_objects) {
    return 0;
  }

  let hazardousCount = 0;

  // neoFeedResponse.near_earth_objects é um objeto onde as chaves são datas
  // ex: { "2024-05-01": [ {...}, {...} ] }
  const dates = Object.keys(neoFeedResponse.near_earth_objects);

  for (const date of dates) {
    const asteroids = neoFeedResponse.near_earth_objects[date];
    if (Array.isArray(asteroids)) {
      for (const asteroid of asteroids) {
        if (asteroid.is_potentially_hazardous_asteroid === true) {
          hazardousCount++;
        }
      }
    }
  }

  return hazardousCount;
};
