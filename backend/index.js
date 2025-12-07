const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// Middleware to enable CORS
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

// MySQL connection
const connection = mysql.createConnection({ // should not be exposde
  host: '127.0.0.1',
  user: 'root',
  password: 'GuppyAzam123', 
  database: 'weatherDashboard' 
});

connection.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL database!');
});

const db = connection.promise();

// Example route
app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express API!' });
});

app.post('/geocode', async (req, res) => {
  try {

    const city = (req.body.city || '').trim();
    if (!city) return res.status(400).json({ error: 'Missing city in request body' });

    // 
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    const geoResp = await fetch(geoUrl);
    if (!geoResp.ok) {
      return res.status(502).json({ error: `Geocoding API responded ${geoResp.status}` });
    }
    const geoJson = await geoResp.json();
    if (!geoJson.results || geoJson.results.length === 0) {
      return res.status(404).json({ error: 'Location not found by geocoding API' });
    }

    const result = geoJson.results[0];
    const name = result.name || city;
    const country = result.country || 'Unknown';
    const latitude = Number(result.latitude);
    const longitude = Number(result.longitude);

    // 2) Check if city already exists (by name+country)
    const [rows] = await db.query(
      'SELECT CityId, Latitude, Longitude FROM weatherData WHERE CityName = ? AND CountryName = ? LIMIT 1',
      [name, country]
    );

    if (rows.length > 0) {
      const existing = rows[0];
    await db.query(
        'UPDATE weatherData SET Latitude = ?, Longitude = ? WHERE CityId = ?',
        [latitude, longitude, existing.id]
      );
      return res.json({
        id: existing.id, name, country, latitude, longitude, created: false,
        message: 'City existed; coordinates updated'
      });
    }

    await db.query(
      'INSERT INTO weatherData (CityName, CountryName, Latitude, Longitude) VALUES (?, ?, ?, ?)',
      [ name, country, latitude, longitude]
    );

    return res.status(201).json({

      message: 'City saved'
    });

  } catch (err) {
    console.error('Error in /geocode:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.get('/weather', async (req, res) => {
  try {

    const city = (req.query.city || '').trim();
    if (!city) return res.status(400).json({ error: 'Missing ?city= parameter' });

    const [rows] = await db.query(
      'SELECT CityName, Temperature, WeatherCode, LastUpdated FROM weatherData WHERE CityName = ? LIMIT 1',
      [city]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    const row = rows[0];
    return res.status(200).json({
      temperature: row.Temperature,
      weatherCode: row.WeatherCode,
      lastUpdated: row.LastUpdated
    });
  } catch (err) {
    console.error('Error in /weather:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});


app.post('/weather/update', async (req, res) => {
  try {

    const city = req.body.city ;
    const longitude = Number(req.body.longitude);
    const latitude = Number(req.body.latitude);

    if (!city) return res.status(400).json({ error: 'Missing city in request body' });
    
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;


    const weatherResp = await fetch(weatherUrl);

    let weatherData;
    const textBody = await weatherResp.text(); // read as text first

    // Try to parse as JSON
    try {
      weatherData = JSON.parse(textBody);
    } catch {
      weatherData = null; // failed to parse JSON (likely HTML)
    }
console.log(weatherData);
    // Handle HTTP errors
    if (!weatherResp.ok) {
      return res.status(502).json({
        error: `Weather API responded ${weatherResp.status}: ${textBody}`
      });
    }

    if (!weatherData || !weatherData.current_weather) {
      return res.status(404).json({ error: 'Weather data not found or invalid JSON' });
    }

    const temperature = weatherData.current_weather.temperature;
    const weatherCode = weatherData.current_weather.weathercode;
    console.log(city);
    console.log(temperature);
    console.log(weatherCode);
    await db.query(

        'UPDATE weatherData SET Temperature = ?, WeatherCode = ?, LastUpdated = NOW() WHERE CityName = ?',
        [temperature, weatherCode, city]
      );
      return res.json({
        temperature, weatherCode,
        message: 'City existed; coordinates updated'
      });
    

    
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
});


// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
