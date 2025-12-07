import { useState, useEffect, useCallback, useRef } from 'react'
import WeatherCard from './weatherCard'
import SelectButton from './SelectButton'
import descriptions from './assets/descriptions.json'
import './App.css'

const cityData = {
  Toronto: {
    latitude: 43.65107,
    longitude: -79.347015,
    country: "Canada",
    timezone: "America/Toronto",
  },
  London: {
    latitude: 51.5074,
    longitude: -0.1278,
    country: "United Kingdom",
    timezone: "Europe/London",
  },
  "New York": {
    latitude: 40.7128,
    longitude: -74.0060,
    country: "United States",
    timezone: "America/New_York",
  },
  Vancouver: {
    latitude: 49.2827,
    longitude: -123.1207,
    country: "Canada",
    timezone: "America/Vancouver",
  },
};

const cities = [
  { name: "Toronto" },
  { name: "London" },
  { name: "New York" },
  { name: "Vancouver" },
];


const formatTimeAgo = (lastUpdated) => {
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

const getWeatherBackgroundType = (weatherCode) => {
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

const getWeatherInfo = (weatherCode, timezone = 'UTC') => {
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

function App() {
  
  const [selectedCity, setSelectedCity] = useState("Vancouver");
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeAgo, setTimeAgo] = useState(null);
  const lastUpdatedRef = useRef(null);

  const fetchWeatherData = useCallback(async (cityName) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/weather?city=${encodeURIComponent(cityName)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch weather data' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const cityInfo = cityData[cityName];
      const timezone = cityInfo?.timezone || 'UTC';
      
      const weatherInfo = getWeatherInfo(data.weatherCode, timezone);
      const backgroundType = getWeatherBackgroundType(data.weatherCode);
      const backgroundTypeWithTime = weatherInfo.isDay ? backgroundType : `${backgroundType}-night`;
      
      const transformedData = {
        city: cityName,
        country: cityData[cityName]?.country,
        temperatureC: data.temperature,
        weatherCode: data.weatherCode,
        description: weatherInfo.description,
        image: weatherInfo.image,
        backgroundType: backgroundTypeWithTime,
        isDay: weatherInfo.isDay,
        windSpeed: data.windSpeed,
        timezone: timezone,
        lastUpdated: data.lastUpdated,
        hourlyData: data.hourlyData || [],
      };
      
      setWeatherData(transformedData);
      lastUpdatedRef.current = data.lastUpdated;
      
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  
  const updateAndFetchWeather = useCallback(async (cityName) => {
    const cityInfo = cityData[cityName];
    if (!cityInfo || !cityInfo.latitude || !cityInfo.longitude) {
      console.error('City coordinates not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updateResponse = await fetch('http://localhost:3000/weather/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          city: cityName,
          latitude: cityInfo.latitude,
          longitude: cityInfo.longitude,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({ error: 'Failed to update weather data' }));
        throw new Error(errorData.error || `Failed to update weather: ${updateResponse.status}`);
      }

      await fetchWeatherData(cityName);
      
    } catch (err) {
      console.error('Error updating and fetching weather data:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [fetchWeatherData]);

  useEffect(() => {
    updateAndFetchWeather(selectedCity);
  }, [updateAndFetchWeather, selectedCity]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      updateAndFetchWeather(selectedCity);
    }, 600000); // 10 minutes = 600000 milliseconds

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedCity, updateAndFetchWeather]);


  // Helper to get day/night status for a city
  const getIsDay = useCallback((timezone) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false
    });
    const hour = parseInt(formatter.format(new Date()), 10);
    return hour >= 6 && hour < 20;
  }, []);

  // Update background based on weather and day/night
  useEffect(() => {
    if (!weatherData) {
      document.body.className = '';
      return;
    }

    const updateBackground = () => {
      const cityInfo = cityData[weatherData.city];
      const timezone = cityInfo?.timezone || 'UTC';
      const isDay = getIsDay(timezone);
      const baseBackgroundType = getWeatherBackgroundType(weatherData.weatherCode);
      const backgroundTypeWithTime = isDay ? baseBackgroundType : `${baseBackgroundType}-night`;
      document.body.className = `weather-bg-${backgroundTypeWithTime}`;
    };

    updateBackground();
    const intervalId = setInterval(updateBackground, 60000);
    return () => clearInterval(intervalId);
  }, [weatherData, getIsDay]);

  // Update time ago display every second
  useEffect(() => {
    if (!weatherData?.lastUpdated) {
      setTimeAgo(null);
      lastUpdatedRef.current = null;
      return;
    }

    lastUpdatedRef.current = weatherData.lastUpdated;
    setTimeAgo(formatTimeAgo(weatherData.lastUpdated));

    const intervalId = setInterval(() => {
      if (lastUpdatedRef.current) {
        setTimeAgo(formatTimeAgo(lastUpdatedRef.current));
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [weatherData]);

  const handleSelectCity = (cityName) => {
    setSelectedCity(cityName);
    updateAndFetchWeather(cityName);
  };

  const handleRefresh = () => {
    updateAndFetchWeather(selectedCity);
  };

  return (
    <div className="app-container">
      <h1 className="dashboard-title">Weather Dashboard</h1>
      <div className="select-wrapper">
        <SelectButton cities={cities} selectedCity={selectedCity} onSelectCity={handleSelectCity} onRefresh={handleRefresh} />
      </div>
      <div className="card-wrapper">
        {timeAgo && (
          <div className="last-updated">
            Last updated {timeAgo}
          </div>
        )}

        {error && !weatherData && <p style={{ color: 'red' }}>Error: {error}</p>}

        {loading ? (
          <div className="weather-card loading-card">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          weatherData && <WeatherCard data={weatherData} />
        )}
      </div>
    </div>
  )
}

export default App

