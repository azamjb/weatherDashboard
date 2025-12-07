import descriptions from '../assets/descriptions.json';

export const formatTimeAgo = (lastUpdated) => {
  if (!lastUpdated) return null;
  
  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffInSeconds = Math.floor((now - updated) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
};

export const getWeatherBackgroundType = (weatherCode) => {
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

export const getWeatherInfo = (weatherCode, timezone = 'UTC') => {
  const code = String(weatherCode);
  let weatherInfo = descriptions[code];
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false
  });
  const hour = parseInt(formatter.format(new Date()), 10);
  const isDay = hour >= 6 && hour < 20;
  
  return {
    ...(isDay ? weatherInfo.day : weatherInfo.night),
    isDay: isDay
  };
};