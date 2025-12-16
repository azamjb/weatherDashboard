import React from "react";
import "./SelectButton.css";

export default function SelectButton({ cities, selectedCity, onSelectCity, onRefresh }) {
  return (
    <div className="select-button-container">
      <div className="select-buttons-group">
        {cities.map((city, index) => ( // looping over each city

          <button key={city.name} // building dynamic css
            className={`select-button ${selectedCity === city.name ? "active" : ""}
            ${ index === 0 ? "first" : "" } 
            ${index === cities.length - 1 ? "last" : ""}`} onClick={() => onSelectCity(city.name)}  // updating selected city on click
          >
            {city.name}
          </button>
        ))}
      </div>
      <button // manual refresh button
        className="refresh-button" 
        onClick={onRefresh} 
        aria-label="Refresh"
        title="Refresh weather data"
      >
      </button>
    </div>
  );
}