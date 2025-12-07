-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS weatherDashboard;
USE weatherDashboard;

-- Create weatherData table
CREATE TABLE IF NOT EXISTS weatherData (
  CityName VARCHAR(100) PRIMARY KEY,
  Temperature DECIMAL(5,2),
  WeatherCode INT,
  LastUpdated DATETIME,
  Latitude DECIMAL(10,8),
  Longitude DECIMAL(11,8)
);

-- Insert initial city data
INSERT INTO weatherData (CityName, Latitude, Longitude) VALUES
('Toronto', 43.65107, -79.347015),
('London', 51.5074, -0.1278),
('New York', 40.7128, -74.0060),
('Vancouver', 49.2827, -123.1207)
ON DUPLICATE KEY UPDATE CityName=CityName;

