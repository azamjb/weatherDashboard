/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from 'react'
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
  },
  London: {
    city: "London",
    latitude: 51.5074,
    longitude: -0.1278,
    country: "United Kingdom",
    temperatureC: null,
    icon: null,
  },
  "New York": {
    city: "New York",
    latitude: 40.7128,
    longitude: -74.0060,
    country: "United States",
    temperatureC: null,
    icon: null,
  },
  Vancouver: {
    city: "Vancouver",
    latitude: 49.2827,
    longitude: -123.1207,
    country: "Canada",
    temperatureC: null,
    icon: null,
  },
};

const cities = [
  { name: "Toronto" },
  { name: "London" },
  { name: "New York" },
  { name: "Vancouver" },
];

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
      };
      
      setWeatherData(transformedData);
      
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

  }, []); 

  useEffect(() => {
    const intervalId = setInterval(() => {
      updateAndFetchWeather(selectedCity);
    }, 600000); // 10 minutes = 600000 milliseconds

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedCity, updateAndFetchWeather]);

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

        {loading && <p>Loading weather data...</p>}
        {error && !weatherData && <p style={{ color: 'red' }}>Error: {error}</p>}

        {weatherData && <WeatherCard data={weatherData} />}
      </div>
    </div>
  )
}

export default App

