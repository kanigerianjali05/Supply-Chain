import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, TrendingUp, Cloud, Truck } from 'lucide-react';
import './RoutePredictionPanel.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function RoutePredictionPanel() {
  const [formData, setFormData] = useState({
    origin: 'Mumbai',
    destination: 'Kolkata',
    weather: 'clear',
    quantity: 100,
    shipping_mode: 'Standard Class',
    product_category: 'General'
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cities = [
    'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 
    'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];

  const weatherOptions = [
    'clear', 'cloudy', 'rainy', 'stormy', 'monsoon', 'foggy'
  ];

  const shippingModes = [
    'Standard Class', 'First Class', 'Same Day', 'Express'
  ];

  const productCategories = [
    'General', 'Electronics', 'Perishables', 'Fragile', 'Hazardous'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: isNaN(value) ? value : parseFloat(value)
    });
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/route-prediction`, formData);
      setPrediction(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get prediction');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
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

  const getRiskGradient = (riskPercentage) => {
    if (riskPercentage >= 70) return 'linear-gradient(135deg, #FF6B6B 0%, #E63946 100%)';
    if (riskPercentage >= 50) return 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)';
    if (riskPercentage >= 30) return 'linear-gradient(135deg, #FFD700 0%, #FBC02D 100%)';
    return 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)';
  };

  return (
    <div className="route-prediction-panel">
      <div className="prediction-card">
        <h3>Route Risk Predictor</h3>
        
        <div className="prediction-form">
          <div className="form-group">
            <label>Origin City:</label>
            <select 
              name="origin" 
              value={formData.origin}
              onChange={handleInputChange}
              className="form-input"
            >
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Destination City:</label>
            <select 
              name="destination" 
              value={formData.destination}
              onChange={handleInputChange}
              className="form-input"
            >
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Weather Conditions:</label>
            <select 
              name="weather" 
              value={formData.weather}
              onChange={handleInputChange}
              className="form-input"
            >
              {weatherOptions.map(w => (
                <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Product Quantity:</label>
            <input 
              type="number" 
              name="quantity" 
              value={formData.quantity}
              onChange={handleInputChange}
              min="1"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Shipping Mode:</label>
            <select 
              name="shipping_mode" 
              value={formData.shipping_mode}
              onChange={handleInputChange}
              className="form-input"
            >
              {shippingModes.map(mode => (
                <option key={mode} value={mode}>{mode}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Product Category:</label>
            <select 
              name="product_category" 
              value={formData.product_category}
              onChange={handleInputChange}
              className="form-input"
            >
              {productCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handlePredict}
            disabled={loading}
            className="predict-btn"
          >
            {loading ? 'Analyzing...' : 'Predict Risk & Weather Impact'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {prediction && (
          <div className="prediction-results">
            <div className="result-header">
              <div className="route-info">
                <h4>{prediction.origin} → {prediction.destination}</h4>
                <p className="weather-tag">
                  <Cloud size={16} />
                  {prediction.weather.charAt(0).toUpperCase() + prediction.weather.slice(1)}
                </p>
              </div>
              
              <div className="risk-badge" style={{ backgroundColor: getRiskBadgeColor(typeof prediction.risk_level === 'object' ? prediction.risk_level.level : prediction.risk_level) }}>
                {(typeof prediction.risk_level === 'object' ? prediction.risk_level.level : prediction.risk_level).toUpperCase()}
              </div>
            </div>

            <div className="risk-visualization">
              <div className="risk-bars">
                <div className="bar-item">
                  <label>Weather Risk</label>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${prediction.weather_risk_percentage}%`,
                        background: getRiskGradient(prediction.weather_risk_percentage)
                      }}
                    />
                  </div>
                  <span className="percentage">{prediction.weather_risk_percentage}%</span>
                </div>

                <div className="bar-item">
                  <label>Shipping Mode Risk</label>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${prediction.shipping_mode_delay_percentage}%`,
                        background: getRiskGradient(prediction.shipping_mode_delay_percentage)
                      }}
                    />
                  </div>
                  <span className="percentage">{prediction.shipping_mode_delay_percentage}%</span>
                </div>

                <div className="bar-item overall">
                  <label>Overall Route Risk</label>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${prediction.overall_route_risk_percentage}%`,
                        background: getRiskGradient(prediction.overall_route_risk_percentage)
                      }}
                    />
                  </div>
                  <span className="percentage">{prediction.overall_route_risk_percentage}%</span>
                </div>
              </div>
            </div>

            <div className="advice-box">
              <div className="advice-content">{prediction.advice}</div>
            </div>

            <div className="weather-details">
              <h5>Weather Impact Details</h5>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Expected Delays</span>
                  <span className="value">{prediction.weather_conditions.expected_delays_hours}h</span>
                </div>
                <div className="detail-item">
                  <span className="label">Traffic</span>
                  <span className="value">{prediction.weather_conditions.traffic_condition.replace('_', ' ')}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Road Condition</span>
                  <span className="value">{prediction.weather_conditions.road_condition.replace('_', ' ')}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Visibility</span>
                  <span className="value">{prediction.weather_conditions.visibility}</span>
                </div>
              </div>
            </div>

            {prediction.recommendations && prediction.recommendations.length > 0 && (
              <div className="recommendations">
                <h5>
                  <TrendingUp size={16} />
                  Recommendations
                </h5>
                <ul>
                  {prediction.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="prediction-timestamp">
              Prediction generated: {new Date(prediction.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
