import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapPin, AlertCircle, Cloud, Send, TrendingUp } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './DelayRiskMap.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function DelayRiskMap() {
  const [routes, setRoutes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const predictionLayersRef = useRef([]);
  
  // Prediction form state
  const [predictionForm, setPredictionForm] = useState({
    origin: 'Mumbai',
    destination: 'Kolkata',
    quantity: 100,
    shipping_mode: 'Standard Class',
    product_category: 'General'
  });

  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState(null);

  const cities = locations.length > 0 
    ? locations.map(loc => loc.name).filter(Boolean)
    : ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];
  const shippingModes = ['Standard Class', 'First Class', 'Same Day', 'Express'];
  const productCategories = ['General', 'Electronics', 'Perishables', 'Fragile', 'Hazardous'];

  useEffect(() => {
    fetchRoutes();
    fetchLocations();
  }, []);

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current && locations.length > 0 && routes.length > 0) {
      initializeMap();
      
      // Update prediction form with valid locations once loaded
      if (locations.length >= 2) {
        setPredictionForm(prev => ({
          ...prev,
          origin: locations[0].name,
          destination: locations[1].name
        }));
      }
    }
  }, [mapRef, locations, routes]);

  // Update map with prediction when a prediction is made
  useEffect(() => {
    if (prediction && mapInstanceRef.current) {
      drawPredictionOnMap();
    }
  }, [prediction]);

  const fetchRoutes = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/routes-map`);
      setRoutes(response.data.routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/location-weather`);
      setLocations(response.data.locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = {
      ...predictionForm,
      [name]: isNaN(value) ? value : parseFloat(value)
    };
    setPredictionForm(updatedForm);
    console.log('🔍 DEBUG DelayRiskMap - Form Updated:', updatedForm);
  };

  const getLocationCoordinates = (cityName) => {
    // Try exact match first
    let location = locations.find(loc => loc.name?.toLowerCase() === cityName?.toLowerCase());
    
    // Try partial match if exact match fails (e.g., "Mumbai" matches "Mumbai Port")
    if (!location) {
      location = locations.find(loc => 
        loc.name?.toLowerCase().includes(cityName?.toLowerCase())
      );
    }
    
    return location;
  };

  const getRiskColorFromPercentage = (percentage) => {
    if (percentage >= 70) return '#FF6B6B';
    if (percentage >= 50) return '#FFA500';
    if (percentage >= 30) return '#FFD700';
    return '#4CAF50';
  };

  const drawPredictionOnMap = () => {
    const mapInstance = mapInstanceRef.current;
    if (!mapInstance) {
      console.warn('Map instance not ready');
      return;
    }

    // Clear previous prediction layers
    predictionLayersRef.current.forEach(layer => {
      try {
        mapInstance.removeLayer(layer);
      } catch (e) {
        console.error('Error removing layer:', e);
      }
    });
    predictionLayersRef.current = [];

    const originLocation = getLocationCoordinates(prediction.origin);
    const destLocation = getLocationCoordinates(prediction.destination);

    // Validate coordinates exist and are valid numbers
    if (!originLocation || !destLocation || 
        !Number.isFinite(originLocation.lat) || !Number.isFinite(originLocation.lng) ||
        !Number.isFinite(destLocation.lat) || !Number.isFinite(destLocation.lng)) {
      console.warn('Invalid coordinates:', { originLocation, destLocation });
      return;
    }

    try {
      // Get risk color based on overall risk percentage
      const riskColor = getRiskColorFromPercentage(prediction.overall_route_risk_percentage);

      // Draw highlighted route line
      const routeLine = L.polyline(
        [
          [originLocation.lat, originLocation.lng],
          [destLocation.lat, destLocation.lng],
        ],
        {
          color: riskColor,
          weight: 6,
          opacity: 0.9,
          dashArray: 'none',
          interactive: true,
        }
      ).addTo(mapInstance);
      predictionLayersRef.current.push(routeLine);

      // Add origin marker with highlight
      const originIcon = L.divIcon({
        html: `
          <div class="prediction-origin-marker">
            <span>📍</span>
            <div class="prediction-label">ORIGIN: ${prediction.origin}</div>
          </div>
        `,
        className: 'prediction-marker-origin',
        iconSize: [60, 70],
        popupAnchor: [0, -70],
      });
      const originMarker = L.marker([originLocation.lat, originLocation.lng], { icon: originIcon }).addTo(mapInstance);
      predictionLayersRef.current.push(originMarker);

      // Add destination marker with highlight
      const destIcon = L.divIcon({
        html: `
          <div class="prediction-dest-marker">
            <span>📍</span>
            <div class="prediction-label">DEST: ${prediction.destination}</div>
          </div>
        `,
        className: 'prediction-marker-dest',
        iconSize: [60, 70],
        popupAnchor: [0, -70],
      });
      const destMarker = L.marker([destLocation.lat, destLocation.lng], { icon: destIcon }).addTo(mapInstance);
      predictionLayersRef.current.push(destMarker);

      // Add prediction info popup at midpoint
      const midLat = (originLocation.lat + destLocation.lat) / 2;
      const midLng = (originLocation.lng + destLocation.lng) / 2;
      
      const riskBadge = L.marker([midLat, midLng], {
        icon: L.divIcon({
          html: `
            <div class="prediction-popup-box" style="background-color: ${riskColor}; border-color: ${riskColor};">
              <div class="popup-content">
                <div class="risk-level" style="color: white; font-weight: bold;">${(typeof prediction.risk_level === 'object' ? prediction.risk_level.level : prediction.risk_level).toUpperCase()}</div>
                <div class="risk-percentage">${prediction.overall_route_risk_percentage}%</div>
                <div class="weather-info">⛅ ${prediction.weather}</div>
                <div class="route-info">🎯 ${Math.round(prediction.estimated_delay_hours)}h ETA</div>
              </div>
            </div>
          `,
          className: 'prediction-info-marker',
          iconSize: [120, 100],
          popupAnchor: [0, -50],
        }),
      }).addTo(mapInstance);
      predictionLayersRef.current.push(riskBadge);

      // Fit map to show the predicted route
      mapInstance.fitBounds([
        [originLocation.lat, originLocation.lng],
        [destLocation.lat, destLocation.lng],
      ], { padding: [100, 100] });
    } catch (error) {
      console.error('Error drawing prediction on map:', error);
    }
  };

  const handlePredict = async () => {
    setPredicting(true);
    setError(null);
    
    try {
      console.log('📤 SENDING TO BACKEND /route-prediction:', predictionForm);
      const response = await axios.post(`${API_BASE_URL}/route-prediction`, predictionForm);
      console.log('📥 RECEIVED FROM BACKEND:', response.data);
      setPrediction(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get prediction');
      console.error('Prediction error:', err);
    } finally {
      setPredicting(false);
    }
  };

  const initializeMap = () => {
    const mapInstance = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    // Add location markers
    locations.forEach((location) => {
      const riskColor = getRiskColor(location.risk_level);
      const weatherIcon = getWeatherIcon(location.weather);
      
      const customIcon = L.divIcon({
        html: `
          <div class="map-marker" style="background-color: ${riskColor};">
            <span class="marker-icon">${weatherIcon}</span>
          </div>
          <div class="marker-label">${location.name}</div>
        `,
        className: 'custom-map-marker',
        iconSize: [50, 50],
        popupAnchor: [0, -50],
      });

      const marker = L.marker([location.lat, location.lng], { icon: customIcon }).addTo(mapInstance);
      
      marker.bindPopup(`
        <div class="map-popup">
          <h4>${location.name}</h4>
          <div class="weather-info">
            <p><strong>Weather:</strong> ${location.weather}</p>
            <p><strong>Temperature:</strong> ${location.temperature}°C</p>
            <p><strong>Humidity:</strong> ${location.humidity}%</p>
            <p><strong>Wind Speed:</strong> ${location.wind_speed}km/h</p>
            <p><strong>Risk Level:</strong> <span style="color: ${riskColor}; font-weight: bold;">${typeof location.risk_level === 'object' ? location.risk_level.level : location.risk_level}</span></p>
          </div>
        </div>
      `);
    });

    // Draw route lines
    routes.forEach((route) => {
      const riskColor = getRouteColor(route.status);
      const dashPattern = route.status === 'high_risk' ? '5, 5' : 'none';
      
      L.polyline(
        [
          [route.origin.lat, route.origin.lng],
          [route.destination.lat, route.destination.lng],
        ],
        {
          color: riskColor,
          weight: 4,
          opacity: 0.7,
          dashArray: dashPattern,
        }
      ).addTo(mapInstance);

      const midLat = (route.origin.lat + route.destination.lat) / 2;
      const midLng = (route.origin.lng + route.destination.lng) / 2;
      
      L.marker([midLat, midLng], {
        icon: L.divIcon({
          html: `<div class="route-label" style="background-color: ${riskColor}; color: white;">
            ${Math.round(route.delay_probability * 100)}%
          </div>`,
          className: 'route-label-marker',
          iconSize: [40, 40],
        }),
      }).addTo(mapInstance);
    });

    mapInstanceRef.current = mapInstance;
  };

  const getWeatherIcon = (weather) => {
    const w = weather?.toLowerCase() || '';
    if (w.includes('rain') || w.includes('stormy')) return '🌧️';
    if (w.includes('storm')) return '⛈️';
    if (w.includes('cloudy') || w.includes('cloud')) return '☁️';
    if (w.includes('clear') || w.includes('sunny')) return '☀️';
    if (w.includes('fog') || w.includes('foggy')) return '🌫️';
    if (w.includes('part')) return '🌤️';
    return '🌤️';
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
        return '#FF6B6B';
      case 'moderate':
        return '#FFA500';
      case 'low':
        return '#4CAF50';
      default:
        return '#808080';
    }
  };

  const getRouteColor = (status) => {
    switch (status) {
      case 'high_risk':
        return '#FF6B6B';
      case 'low_risk':
        return '#4CAF50';
      default:
        return '#FFA500';
    }
  };

  const getRiskGradient = (riskPercentage) => {
    if (riskPercentage >= 70) return 'linear-gradient(135deg, #FF6B6B 0%, #E63946 100%)';
    if (riskPercentage >= 50) return 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)';
    if (riskPercentage >= 30) return 'linear-gradient(135deg, #FFD700 0%, #FBC02D 100%)';
    return 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)';
  };

  const getRiskBadgeColor = (riskLevel) => {
    switch (riskLevel) {
      case 'critical':
        return '#FF6B6B';
      case 'high':
        return '#FFA500';
      case 'medium':
        return '#FFD700';
      case 'low':
        return '#4CAF50';
      default:
        return '#808080';
    }
  };

  return (
    <div className="delay-risk-map">
      <h2>🎯 Route Risk Prediction & Weather Analysis</h2>
      
      {/* Compact Prediction Form Section */}
      <div className="prediction-form-bar">
        <div className="form-inputs-row">
          <div className="form-group">
            <label>Origin</label>
            <select 
              name="origin" 
              value={predictionForm.origin}
              onChange={handleFormChange}
              className="form-input"
            >
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Destination</label>
            <select 
              name="destination" 
              value={predictionForm.destination}
              onChange={handleFormChange}
              className="form-input"
            >
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantity</label>
            <input 
              type="number" 
              name="quantity" 
              value={predictionForm.quantity}
              onChange={handleFormChange}
              min="1"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Shipping</label>
            <select 
              name="shipping_mode" 
              value={predictionForm.shipping_mode}
              onChange={handleFormChange}
              className="form-input"
            >
              {shippingModes.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>
            <select 
              name="product_category" 
              value={predictionForm.product_category}
              onChange={handleFormChange}
              className="form-input"
            >
              {productCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handlePredict}
            disabled={predicting}
            className="predict-btn"
          >
            <Send size={16} />
            {predicting ? 'Analyzing...' : 'Predict'}
          </button>

          {error && (
            <div className="form-error">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Map Section - Main View */}
      <div className="map-section">
        <div className="map-container-wrapper">
          <div className="map-wrapper">
            <div 
              ref={mapRef}
              className="leaflet-map-container"
              style={{ height: '100%', width: '100%', borderRadius: '8px' }}
            />
            
            {/* Prediction Results Overlay */}
            {prediction && (
              <div className="prediction-overlay">
                <div className="overlay-header">
                  <div className="route-title">
                    {prediction.origin} → {prediction.destination}
                    <span className="weather-badge">⛅ {prediction.weather.charAt(0).toUpperCase() + prediction.weather.slice(1)}</span>
                  </div>
                  <div className="risk-badge-large" style={{ backgroundColor: getRiskBadgeColor(typeof prediction.risk_level === 'object' ? prediction.risk_level.level : prediction.risk_level) }}>
                    {(typeof prediction.risk_level === 'object' ? prediction.risk_level.level : prediction.risk_level).toUpperCase()}
                  </div>
                </div>

                {/* DEBUG SECTION - Shows factors used in calculation */}
                {prediction && prediction.weather_factor && (
                  <div style={{ backgroundColor: '#0d1b2a', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #00FF00', fontSize: '11px' }}>
                    <h5 style={{ marginTop: 0, color: '#00FF00', fontSize: '11px', marginBottom: '8px' }}>🔍 Risk Factors Applied:</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      <div><span style={{ color: '#AAA' }}>Weather:</span> <span style={{ color: '#FF9800', fontWeight: 'bold', marginLeft: '4px' }}>{prediction.weather_factor}x</span></div>
                      <div><span style={{ color: '#AAA' }}>Shipping:</span> <span style={{ color: '#2196F3', fontWeight: 'bold', marginLeft: '4px' }}>{prediction.shipping_factor}x</span></div>
                      <div><span style={{ color: '#AAA' }}>Product:</span> <span style={{ color: '#4CAF50', fontWeight: 'bold', marginLeft: '4px' }}>{prediction.product_factor}x</span></div>
                      <div><span style={{ color: '#AAA' }}>Quantity:</span> <span style={{ color: '#9C27B0', fontWeight: 'bold', marginLeft: '4px' }}>{prediction.quantity_factor}x</span></div>
                    </div>
                    <div style={{ marginTop: '8px', textAlign: 'center', padding: '8px', backgroundColor: '#1a2b3d', borderRadius: '4px' }}>
                      <span style={{ color: '#AAA' }}>Combined:</span> <span style={{ color: '#FFD700', fontWeight: 'bold', marginLeft: '4px', fontSize: '12px' }}>{prediction.combined_multiplier}x</span>
                    </div>
                  </div>
                )}

                <div className="overlay-content">
                  <div className="risk-bars-compact">
                    <div className="bar-item-compact overall-compact">
                      <div className="bar-label">Overall Route Risk</div>
                      <div className="progress-bar-compact">
                        <div 
                          className="progress-fill-compact" 
                          style={{ 
                            width: `${prediction.overall_route_risk_percentage}%`,
                            background: getRiskGradient(prediction.overall_route_risk_percentage)
                          }}
                        />
                      </div>
                      <div className="bar-value">{prediction.overall_route_risk_percentage}%</div>
                    </div>

                    <div className="bar-item-compact">
                      <div className="bar-label">Weather Risk</div>
                      <div className="progress-bar-compact">
                        <div 
                          className="progress-fill-compact" 
                          style={{ 
                            width: `${prediction.weather_risk_percentage}%`,
                            background: getRiskGradient(prediction.weather_risk_percentage)
                          }}
                        />
                      </div>
                      <div className="bar-value">{prediction.weather_risk_percentage}%</div>
                    </div>

                    <div className="bar-item-compact">
                      <div className="bar-label">Shipping Mode Risk</div>
                      <div className="progress-bar-compact">
                        <div 
                          className="progress-fill-compact" 
                          style={{ 
                            width: `${prediction.shipping_mode_delay_percentage}%`,
                            background: getRiskGradient(prediction.shipping_mode_delay_percentage)
                          }}
                        />
                      </div>
                      <div className="bar-value">{prediction.shipping_mode_delay_percentage}%</div>
                    </div>
                  </div>

                  <div className="advice-box-compact">
                    {prediction.advice}
                  </div>

                  <div className="weather-details-compact">
                    <h5>⛅ Weather Impact</h5>
                    <div className="detail-grid-compact">
                      <div className="detail-item-compact">
                        <span className="detail-label">Expected Delays</span>
                        <span className="detail-value">{prediction.weather_conditions.expected_delays_hours}h</span>
                      </div>
                      <div className="detail-item-compact">
                        <span className="detail-label">Traffic</span>
                        <span className="detail-value">{prediction.weather_conditions.traffic_condition.replace('_', ' ')}</span>
                      </div>
                      <div className="detail-item-compact">
                        <span className="detail-label">Road Condition</span>
                        <span className="detail-value">{prediction.weather_conditions.road_condition.replace('_', ' ')}</span>
                      </div>
                      <div className="detail-item-compact">
                        <span className="detail-label">Visibility</span>
                        <span className="detail-value">{prediction.weather_conditions.visibility}</span>
                      </div>
                    </div>
                  </div>

                  {prediction.recommendations && prediction.recommendations.length > 0 && (
                    <div className="recommendations-compact">
                      <h5>📋 Recommendations</h5>
                      <ul>
                        {prediction.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="prediction-timestamp-compact">
                    Generated: {new Date(prediction.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
            
            <div className="map-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#FF6B6B' }}></div>
                <span>High Risk</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#FFA500' }}></div>
                <span>Moderate Risk</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#4CAF50' }}></div>
                <span>Low Risk</span>
              </div>
              <div className="legend-item">
                <span>🌧️ Monsoon</span>
              </div>
              <div className="legend-item">
                <span>☀️ Clear</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Routes Info Section */}
      <div className="routes-info-section">
        <h3>📦 Active Routes Analysis</h3>
        <div className="routes-scroll">
          {routes.map((route) => (
            <div
              key={route.id}
              className="route-card"
              style={{ borderTopColor: getRouteColor(route.status) }}
              onClick={() => setSelectedRoute(selectedRoute?.id === route.id ? null : route)}
            >
              <div className="route-header">
                <div className="route-name">
                  <MapPin size={18} style={{ color: getRouteColor(route.status) }} />
                  <span>{route.name}</span>
                </div>
                <div className="delay-risk">
                  <div 
                    className="risk-circle" 
                    style={{ backgroundColor: getRouteColor(route.status) }}
                  >
                    {route.delays}/{route.shipments}
                  </div>
                </div>
              </div>
              
              {selectedRoute?.id === route.id && (
                <div className="route-details">
                  <div className="detail-item">
                    <span>Origin:</span>
                    <strong>{route.origin.name}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Destination:</span>
                    <strong>{route.destination.name}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Active Shipments:</span>
                    <strong>{route.shipments}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Delayed Shipments:</span>
                    <strong>{route.delays}</strong>
                  </div>
                  <div className="detail-item">
                    <span>ETA:</span>
                    <strong>{route.eta_hours}h</strong>
                  </div>
                  <div className="detail-item">
                    <span>Location:</span>
                    <strong>{route.current_location}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Weather:</span>
                    <strong>{route.weather_condition}</strong>
                  </div>
                  <div className="detail-item">
                    <span>Status:</span>
                    <strong className={`status ${route.status}`}>
                      {route.status === 'high_risk' ? '🔴 High Risk' : route.status === 'low_risk' ? '🟢 On Track' : '🟡 Caution'}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
