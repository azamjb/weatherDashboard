import descriptions from '../assets/descriptions.json'; // importing weather descriptions

export const formatTimeAgo = (lastUpdated) => { // Converting timestamp into human readable text '25 seconds ago, 2 minutes ago'

  if (!lastUpdated) return null;
  
  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffInSeconds = Math.floor((now - updated) / 1000); // difference between current time and last updated time

  if (diffInSeconds < 60) { // if less than a minute, phrase in seconds
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) { // if less than an hour, phrase in minutes
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`; // otherwise phrase in hours
};

export const getWeatherBackgroundType = (weatherCode) => { // mapping open-meteo weather codes to background types

  const code = parseInt(weatherCode, 10);
  if (code === 0 || code === 1) return 'sunny';
  if (code === 2) return 'partly-cloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'foggy';
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rainy';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snowy';
  if (code >= 95 && code <= 99) return 'stormy';
  return 'partly-cloudy';

};

export const getWeatherInfo = (weatherCode, timezone = 'UTC') => { // returning weather description and icon based on weather code and timezoone / time of day

  const code = String(weatherCode);
  let weatherInfo = descriptions[code]; // fetching weather info from descriptions.json based on weather code
  
  const formatter = new Intl.DateTimeFormat('en-US', { // formatter object for specific timezone
    timeZone: timezone,
    hour: 'numeric',
    hour12: false
  });
  const hour = parseInt(formatter.format(new Date()), 10); // gets current hour (24 hr time) in a specific timezone
  const isDay = hour >= 6 && hour < 20; // whether it is day or night
  
  return {
    ...(isDay ? weatherInfo.day : weatherInfo.night),
    isDay: isDay
  };
};