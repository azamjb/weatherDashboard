import React, { useState, useEffect } from "react";
import "./weatherCard.css"; 

export default function WeatherCard({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [currentTimeString, setCurrentTimeString] = useState('');
  
  // Update time every minute
  useEffect(() => {
    if (!data.timezone) return;
    
    const updateTime = () => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: data.timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      setCurrentTimeString(formatter.format(new Date()));
    };
    
    updateTime(); // Update immediately
    const interval = setInterval(updateTime, 60000); // Update every minute
    
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
                <span className="weather-time">
                  {currentTimeString}
                </span>
              )}
            </div>
            <span className="weather-country">{data.country}</span>
          </div>

          <div className="weather-temp">
            <span className="temp-value">{data.temperatureC.toFixed(1)}°C</span>
            <span className="temp-feel">Feels like {Math.round(data.temperatureC)}°</span>
          </div>
        </div>

        <div className="weather-right">
          {data.image && (
            <div className={`weather-icon-container weather-icon-${data.backgroundType || 'partly-cloudy'}`}>
              <img 
                src={data.image} 
                alt={data.description || "Weather icon"} 
                className="weather-icon-image"
              />
              {data.windSpeed != null && (
                <div className="wind-speed">
                  Wind: {data.windSpeed.toFixed(1)} km/h
                </div>
              )}
              <p className="weather-description">{data.description || "Unknown"}</p>
            </div>
          )}
        </div>
      </div>

      {data.hourlyData?.length > 0 && (
        <div className="weather-chart-container">
          <h3 className="chart-title">12-Hour Temperature Forecast</h3>
            <div 
            className="chart-wrapper"
            onMouseLeave={() => {
              setHoveredIndex(null);
              setTooltipStyle({});
            }}
          >
            {(() => {
              const temps = data.hourlyData.map(d => d.temp);
              const minTemp = Math.min(...temps);
              const maxTemp = Math.max(...temps);
              const tempRange = maxTemp - minTemp || 10;
              const padding = tempRange * 0.2;
              const chartMin = minTemp - padding;
              const chartMax = maxTemp + padding;
              const chartRange = chartMax - chartMin;
              
              const getPointCoords = (i) => {
                const x = (i / (data.hourlyData.length - 1)) * 600;
                const y = 130 - ((data.hourlyData[i].temp - chartMin) / chartRange) * 110;
                return { x, y };
              };

              return (
                <>
                  <svg className="temperature-chart" viewBox="0 0 600 140" preserveAspectRatio="none">
                    <polyline
                      className="temperature-line"
                      points={data.hourlyData.map((point, i) => {
                        const { x, y } = getPointCoords(i);
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="url(#temperatureGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {data.hourlyData.map((point, i) => {
                      const { x, y } = getPointCoords(i);
                      const segmentWidth = 600 / (data.hourlyData.length - 1);
                      const startX = i === 0 ? 0 : x - segmentWidth / 2;
                      const endX = i === data.hourlyData.length - 1 ? 600 : x + segmentWidth / 2;
                      
                      return (
                        <g key={i}>
                          <rect
                            x={startX}
                            y={0}
                            width={endX - startX}
                            height={140}
                            fill="transparent"
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={(e) => {
                              setHoveredIndex(i);
                              const svg = e.currentTarget.closest('svg');
                              if (svg) {
                                const svgRect = svg.getBoundingClientRect();
                                const scaleX = svgRect.width / 600;
                                const scaleY = svgRect.height / 140;
                                setTooltipStyle({
                                  left: `${x * scaleX}px`,
                                  top: `${(y * scaleY) - 25}px`
                                });
                              }
                            }}
                          />
                          <circle
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
                  {hoveredIndex !== null && (
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
                        {data.hourlyData[hoveredIndex].temp.toFixed(1)}°C
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
            <div className="chart-labels">
              {data.hourlyData.map((point, i) => {
                const date = new Date(point.time);
                const isCurrent = i === Math.floor(data.hourlyData.length / 2);
                return (
                  <div key={i} className={`chart-label ${isCurrent ? 'current-hour' : ''}`}>
                    <span className="chart-time">{date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}</span>
                    <span className="chart-temp">{point.temp.toFixed(0)}°</span>
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
