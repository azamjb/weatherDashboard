require('dotenv').config(); // load env
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

app.use(cors());

app.use(express.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', 
  database: process.env.DB_NAME || 'weatherDashboard' 
});

connection.connect(err => {
  if (err) {
    console.error('Failed to connect to MySQL:', err.message);
    process.exit(1); 
  }
  console.log('Connected to MySQL database!');
});

const db = connection.promise();

// Initializing mySql connection & connecting to db^

app.get('/weather', async (req, res) => { // Retrieving weather data from db, plus additional data from external API

  try {
    const city = (req.query.city || '').trim();
    if (!city) return res.status(400).json({ error: 'Missing ?city= parameter' });

    const [rows] = await db.query(
      'SELECT CityName, Temperature, WeatherCode, LastUpdated, Latitude, Longitude FROM weatherData WHERE CityName = ? LIMIT 1', // query db for city
      [city]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    const row = rows[0];
    let windSpeed = null;
    let hourlyData = [];

    try {

      const weatherApiBaseUrl = process.env.WEATHER_API_BASE_URL;
      const weatherUrl = `${weatherApiBaseUrl}?latitude=${row.Latitude}&longitude=${row.Longitude}&current_weather=true&hourly=temperature_2m&past_days=1&forecast_days=1`;
      
      const weatherResponse = await fetch(weatherUrl); // fetching hourly data and windspeed from external API

      if (weatherResponse.ok) {
        const weatherJson = await weatherResponse.json();
        
        windSpeed = weatherJson.current_weather.windspeed; // extract windspeed
      
        if (weatherJson.hourly && weatherJson.hourly.time && weatherJson.hourly.temperature_2m) {
          const now = new Date();
          const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0); // retrieve current hour
          
          const times = weatherJson.hourly.time;
          const temps = weatherJson.hourly.temperature_2m; // temperature at a certain time
          
          let currentIndex = -1;

          for (let i = 0; i < times.length; i++) { // find first hour that corresponds to right now

            const timeDate = new Date(times[i]);
            if (timeDate >= currentHour) {
              currentIndex = i;
              break;
            }
          }
          
          if (currentIndex === -1) {
            currentIndex = times.length - 1;
          }
          
          const startIndex = Math.max(0, currentIndex - 6);
          const endIndex = Math.min(times.length - 1, currentIndex + 6);

          // Full 12 hour window ^
          
          hourlyData = times.slice(startIndex, endIndex + 1).map((time, index) => ({ // combining time and temperature into objects w/ relevant time range
            time: time,
            temp: temps[startIndex + index]
          }));
        }
      }
    } catch (weatherErr) {
      console.error('Error fetching weather data:', weatherErr);
    }
    
    return res.status(200).json({
      temperature: row.Temperature,
      weatherCode: row.WeatherCode,
      lastUpdated: row.LastUpdated,
      windSpeed: windSpeed,
      hourlyData: hourlyData
    });

  } catch (err) {
    console.error('Error in /weather:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.post('/weather/update', async (req, res) => { // updating weather data stored in db from an external API
  try {
    const city = req.body.city;
    const longitude = Number(req.body.longitude);
    const latitude = Number(req.body.latitude);

    const weatherApiBaseUrl = process.env.WEATHER_API_BASE_URL;
    const weatherUrl = `${weatherApiBaseUrl}?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

    const weatherResp = await fetch(weatherUrl); // call API for current weather

    const textBody = await weatherResp.text();
    let weatherData = JSON.parse(textBody);
    
    if (!weatherResp.ok) { // error handling
      return res.status(502).json({
        error: `Weather API responded ${weatherResp.status}: ${textBody}`
      });
    }

    if (!weatherData || !weatherData.current_weather) {
      return res.status(404).json({ error: 'Weather data not found or invalid JSON' });
    }

    const temperature = weatherData.current_weather.temperature;
    const weatherCode = weatherData.current_weather.weathercode;

    await db.query(
      'UPDATE weatherData SET Temperature = ?, WeatherCode = ?, LastUpdated = NOW() WHERE CityName = ?', // store results in db
      [temperature, weatherCode, city]
    );

    return res.json({
      temperature,
      weatherCode,
      message: 'Weather data updated'
    });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`); // start server
});
