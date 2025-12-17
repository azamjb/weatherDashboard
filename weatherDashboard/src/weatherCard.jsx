import React, { useState, useEffect } from "react";
import "./weatherCard.css"; 

export default function WeatherCard({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [currentTimeString, setCurrentTimeString] = useState('');

  useEffect(() => { // set current time string for specific timezone
    
    const updateTime = () => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: data.timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      setCurrentTimeString(formatter.format(new Date()));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    
    return () => clearInterval(interval);
  }, [data.timezone]);

  return (
    <div className="weather-card">
      <div className="weather-card-main">
        <div className="weather-left">

          <div className="weather-location">
            <div className="weather-city-row">
              <h2 className="weather-city">{data.city}</h2>
              {currentTimeString && (
                <span className="weather-time"> {currentTimeString} </span>
              )}
            </div>
            <span className="weather-country">{data.country}</span>
          </div>

          <div className="weather-temp">
            <span className="temp-value"> {data.temperatureC != null ? Number(data.temperatureC).toFixed(1) : '--'}°C </span> 
            <span className="temp-feel"> Feels like {data.temperatureC != null ? Math.round(Number(data.temperatureC)) : '--'}° </span>
          </div>

        </div>

        <div className="weather-right">

          <div className={`weather-icon-container weather-icon-${data.backgroundType || 'partly-cloudy'}`}> 
            
            <img 
              src={data.image} 
              alt={data.description || "Weather icon"} 
              className="weather-icon-image"
            />
            {data.windSpeed != null && (
              <div className="wind-speed">
                Wind: {Number(data.windSpeed).toFixed(1)} km/h
              </div>
            )}
            <p className="weather-description">{data.description || "Unknown"}</p>

          </div>
          
        </div>
      </div>

      {data.hourlyData?.length > 0 && (

        <div className="weather-chart-container">

          <h3 className="chart-title">Hourly Forecast</h3>
            <div 
              className="chart-wrapper"
              onMouseLeave={() => { setHoveredIndex(null); setTooltipStyle({}); }} // tooltips hovering toggle
             >
            {(() => {

              const temps = data.hourlyData.map(d => d.temp).filter(t => t != null).map(t => Number(t));
              if (temps.length === 0) return null;
              const minTemp = Math.min(...temps);
              const maxTemp = Math.max(...temps);
              const tempRange = maxTemp - minTemp || 10;
              const padding = tempRange * 0.2;
              const chartMin = minTemp - padding;
              const chartMax = maxTemp + padding;
              const chartRange = chartMax - chartMin;

              // Finding ranges & min / max so graph can scale accordingly
              
              const getPointCoords = (i) => { // converting hourly data points to x,y coordinates

                const x = (i / (data.hourlyData.length - 1)) * 600;
                const temp = data.hourlyData[i].temp != null ? Number(data.hourlyData[i].temp) : chartMin;
                const y = 130 - ((temp - chartMin) / chartRange) * 110;
                return { x, y };

              };

              return (
                <>
                  <svg className="temperature-chart" viewBox="0 0 600 140" preserveAspectRatio="none">

                    <polyline // temperature line

                      className="temperature-line"
                      points={data.hourlyData.map((point, i) => {
                        const { x, y } = getPointCoords(i);
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none" stroke="url(#temperatureGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"

                    />

                    {data.hourlyData.map((point, i) => { // looping through hourly data points

                      const { x, y } = getPointCoords(i);
                      const segmentWidth = 600 / (data.hourlyData.length - 1); // hover zone
                      const startX = i === 0 ? 0 : x - segmentWidth / 2;
                      const endX = i === data.hourlyData.length - 1 ? 600 : x + segmentWidth / 2;
                      
                      return (
                        <g key={i}>
                          <rect // hover rectangle
                            x={startX}
                            y={0}
                            width={endX - startX}
                            height={140}
                            fill="transparent"
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                              setHoveredIndex(i); // set hover point on hover
                              const svg = e.currentTarget.closest('svg');
                              if (svg) {
                                const svgRect = svg.getBoundingClientRect();
                                const scaleX = svgRect.width / 600;
                                const scaleY = svgRect.height / 140;
                                setTooltipStyle({
                                  left: `${x * scaleX}px`,
                                  top: `${(y * scaleY) - 25}px`
                                });
                                // positioning tooltip ^
                              }
                            }}
                          />
                          <circle // dot for each point
                            cx={x}
                            cy={y}
                            r={hoveredIndex === i ? 6 : 4}
                            fill="#4facfe"
                            className="chart-point"
                            style={{ 
                              opacity: hoveredIndex === i ? 1 : 0.6,
                              transition: 'all 0.2s ease',
                              pointerEvents: 'none'
                            }}
                          />
                        </g>
                      );
                    })}
                    <defs>
                      <linearGradient id="temperatureGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4facfe" />
                        <stop offset="100%" stopColor="#00f2fe" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {hoveredIndex !== null && ( // tooltip display
                    <div 
                      className="chart-tooltip"
                      style={tooltipStyle}
                    >
                      <div className="tooltip-time">
                        {new Date(data.hourlyData[hoveredIndex].time).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </div>
                      <div className="tooltip-temp">
                        {data.hourlyData[hoveredIndex].temp != null 
                          ? Number(data.hourlyData[hoveredIndex].temp).toFixed(1) 
                          : '--'}°C
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
            <div className="chart-labels"> 
              {data.hourlyData.map((point, i) => { // x axis labels
                const date = new Date(point.time);
                const isCurrent = i === Math.floor(data.hourlyData.length / 2);
                return (
                  <div key={i} className={`chart-label ${isCurrent ? 'current-hour' : ''}`}>
                    <span className="chart-time">{date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}</span>
                    <span className="chart-temp">
                      {point.temp != null ? Number(point.temp).toFixed(0) : '--'}°
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
