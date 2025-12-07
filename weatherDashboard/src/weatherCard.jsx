import React from "react";
import "./weatherCard.css"; 

export default function WeatherCard({ data }) {
  
  return (

    <div className="weather-card">
  
      <div className="weather-left">

        <div className="weather-location">
          <h2 className="weather-city">{data.city}</h2>
          <span className="weather-country">{data.country}</span>
        </div>

        <div className="weather-temp">
          <span className="temp-value">{data.temperatureC.toFixed(1)}°C</span>
          <span className="temp-feel">Feels like {Math.round(data.temperatureC)}°</span>
        </div>


      </div>

      <div className="weather-right">
        {data.icon === "sunny" && (
          <>
            <div className="sun-container" aria-hidden>
              <div className="sun-core" />
              <div className="sun-rays" />
            </div>
            <p className="weather-description">Sunny</p>
          </>
        )}

        {data.icon === "partly-cloudy" && (
          <>
            <div className="cloudy-container" aria-hidden>
              <div className="cloud cloud1" />
              <div className="cloud cloud2" />
              <div className="sun-small" />
            </div>
            <p className="weather-description">Partly Cloudy</p>
          </>
        )}

        {data.icon === "rain" && (
          <>
            <div className="rain-container" aria-hidden>
              <div className="rain-cloud" />
              <div className="raindrop r1" />
              <div className="raindrop r2" />
              <div className="raindrop r3" />
            </div>
            <p className="weather-description">Rainy</p>
          </>
        )}
      </div>
    </div>
  );
}
