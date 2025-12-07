import React from "react";
import "./SelectButton.css";

export default function SelectButton({ cities, selectedCity, onSelectCity, onRefresh }) {
  return (

    <div className="select-button-container">
      <div className="select-buttons-group">

        {cities.map((city, index) => (

          <button key={city.name}
            className={`select-button ${selectedCity === city.name ? "active" : ""} ${ index === 0 ? "first" : "" } ${index === cities.length - 1 ? "last" : ""}`} onClick={() => onSelectCity(city.name)}
          >
            {city.name}
          </button>
        ))}
      </div>
      
      <button className="refresh-button" onClick={onRefresh} aria-label="Refresh">
        ↻
      </button>
    </div>
  );
}

