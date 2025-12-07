/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useRef } from 'react'
import reactLogo from './assets/react.svg'
import WeatherCard from './weatherCard'
import viteLogo from '/vite.svg'
import SelectButton from './SelectButton'
import './App.css'

const cityData = {
  Toronto: {
    city: "Toronto",
    latitude: 43.65107,
    longitude: -79.347015,
    country: "Canada",
    temperatureC: null,
    icon: null,
    lastUpdated: null,
  },
  London: {
    city: "London",
    latitude: 51.5074,
    longitude: -0.1278,
    country: "United Kingdom",
    temperatureC: null,
    icon: null,
    lastUpdated: null,
    
  },
  "New York": {
    city: "New York",
    latitude: 40.7128,
    longitude: -74.0060,
    country: "United States",
    temperatureC: null,
    icon: null,
    lastUpdated: null,
  },
  Vancouver: {
    city: "Vancouver",
    latitude: 49.2827,
    longitude: -123.1207,
    country: "Canada",
    temperatureC: null,
    icon: null,
    lastUpdated: null,
  },
};

const cities = [
  { name: "Toronto" },
  { name: "London" },
  { name: "New York" },
  { name: "Vancouver" },
];

// Helper function to format time ago
const formatTimeAgo = (lastUpdated) => {
  if (!lastUpdated) return null;
  
  try {
    const now = new Date();
    // Handle MySQL DATETIME format (e.g., "2024-01-01 12:00:00")
    const updated = new Date(lastUpdated);
    
    // Check if date is valid
    if (isNaN(updated.getTime())) {
      console.error('Invalid date:', lastUpdated);
      return null;
    }
    
    const diffInSeconds = Math.floor((now - updated) / 1000);
    
    // If negative, the date is in the future (timezone issue or invalid date)
    if (diffInSeconds < 0) {
      return 'just now';
    }
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } catch (err) {
    console.error('Error formatting time ago:', err);
    return null;
  }
};

// todo
const getWeatherIcon = (weatherCode) => {
  if (weatherCode === 0) return "sunny";
  if (weatherCode >= 1 && weatherCode <= 3) return "partly-cloudy";
  if (weatherCode >= 51 && weatherCode <= 99) return "rain";
  return "partly-cloudy"; 
};

function App() {
  
  const [selectedCity, setSelectedCity] = useState("Vancouver");
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeAgo, setTimeAgo] = useState(null);
  const lastUpdatedRef = useRef(null);

  const fetchWeatherData = useCallback(async (cityName) => {
    if (!cityName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:3000/weather?city=${encodeURIComponent(cityName)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch weather data' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const transformedData = {
        city: cityName,
        country: cityData[cityName]?.country,
        temperatureC: data.temperature,
        icon: getWeatherIcon(data.weatherCode),
        lastUpdated: data.lastUpdated,
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
    if (!cityName) return;
    
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount 

  useEffect(() => {
    const intervalId = setInterval(() => {
      updateAndFetchWeather(selectedCity);
    }, 600000); // 10 minutes = 600000 milliseconds

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedCity, updateAndFetchWeather]);

  // Update time ago display every second
  useEffect(() => {
    if (!weatherData?.lastUpdated) {
      setTimeAgo(null);
      lastUpdatedRef.current = null;
      return;
    }

    lastUpdatedRef.current = weatherData.lastUpdated;
    
    // Update immediately
    setTimeAgo(formatTimeAgo(weatherData.lastUpdated));

    // Update every second - use ref to get current value
    const intervalId = setInterval(() => {
      if (lastUpdatedRef.current) {
        setTimeAgo(formatTimeAgo(lastUpdatedRef.current));
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
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

        {loading && <p>Loading weather data...</p>}
        {error && !weatherData && <p style={{ color: 'red' }}>Error: {error}</p>}

        {weatherData && <WeatherCard data={weatherData} />}
      </div>
    </div>
  )
}

export default App

