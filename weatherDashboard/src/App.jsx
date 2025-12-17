import { useState, useEffect, useCallback } from 'react'
import WeatherCard from './weatherCard'
import SelectButton from './SelectButton'
import { formatTimeAgo, getWeatherBackgroundType, getWeatherInfo } from './utils/weatherUtils'
import { API_URL } from './config'
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

function App() {
  
  const [selectedCity, setSelectedCity] = useState("Vancouver"); // which city the user is currently viewing
  const [weatherData, setWeatherData] = useState(null); // the current weather data for the selected city
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeAgo, setTimeAgo] = useState(null); // last updated time ago string

  const fetchWeatherData = useCallback(async (cityName) => { // Function to fetch weather data from backend
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/weather?city=${encodeURIComponent(cityName)}`); // calling /weather endpoint

      if (!response.ok) { // error handling
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch weather data' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const cityInfo = cityData[cityName];
      const timezone = cityInfo?.timezone || 'UTC'; // retrieve timezone
      
      const weatherInfo = getWeatherInfo(data.weatherCode, timezone); // util function for weather info
      const backgroundType = getWeatherBackgroundType(data.weatherCode); // util function for dynamic background type
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
      
      setWeatherData(transformedData); // set weather data state
      
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAndFetchWeather = useCallback(async (cityName) => {

    const cityInfo = cityData[cityName];

    setLoading(true);
    setError(null);

    try {
      const updateResponse = await fetch(`${API_URL}/weather/update`, { // make post request to /weather/update endpoint, with city name, latitude, and longitude
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

      if (!updateResponse.ok) { // error handling
        const errorData = await updateResponse.json().catch(() => ({ error: 'Failed to update weather data' }));
        throw new Error(errorData.error || `Failed to update weather: ${updateResponse.status}`);
      }

      await fetchWeatherData(cityName); // after updating db content, fetch from db to display on frontend
      
    } catch (err) {
      console.error('Error updating and fetching weather data:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [fetchWeatherData]); 

  useEffect(() => { // whenever city is changed, auto update and fetch data for that city
    
    updateAndFetchWeather(selectedCity);
  }, [updateAndFetchWeather, selectedCity]);

  useEffect(() => { // set 10 minute interval for auto refreshing weather data
    
    const intervalId = setInterval(() => {
      updateAndFetchWeather(selectedCity);
    }, 600000); // 10 minutes = 600000 milliseconds

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedCity, updateAndFetchWeather]); // timer is reset whenever city changes

  const getIsDay = useCallback((timezone) => { // get current hour in city timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false
    });
    const hour = parseInt(formatter.format(new Date()), 10);
    return hour >= 6 && hour < 20;
  }, []);

  useEffect(() => { // keeps page background in sync with current city weather and time

    if (!weatherData) {
      document.body.className = '';
      return;
    }

    const updateBackground = () => { // update page background based on weather and time

      const cityInfo = cityData[weatherData.city];
      const timezone = cityInfo?.timezone || 'UTC';
      const isDay = getIsDay(timezone);
      const baseBackgroundType = getWeatherBackgroundType(weatherData.weatherCode);
      const backgroundTypeWithTime = isDay ? baseBackgroundType : `${baseBackgroundType}-night`;
      document.body.className = `weather-bg-${backgroundTypeWithTime}`; // apply corresponding css style to body
    };

    updateBackground();
    const intervalId = setInterval(updateBackground, 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [weatherData, getIsDay]);

  useEffect(() => {

    if (!weatherData?.lastUpdated) {
      setTimeAgo(null);
      return;
    }

    setTimeAgo(formatTimeAgo(weatherData.lastUpdated));

    const intervalId = setInterval(() => { // start timer to update "time ago" string every second
      
        setTimeAgo(formatTimeAgo(weatherData.lastUpdated));
      
    }, 1000);

    return () => clearInterval(intervalId);

  }, [weatherData]); // runs every tiue weatherData changes

  const handleSelectCity = (cityName) => { // handle new city selected (set city, update and fetch weather data for city)
    
    setSelectedCity(cityName);
  };

  const handleRefresh = () => { // for manual refresh button
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

