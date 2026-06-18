import React, { useState } from 'react';
import axios from 'axios';
import { AlertCircle, TrendingUp, Users, Zap, CheckCircle, BarChart3 } from 'lucide-react';
import './SupplyChainAnalyzer.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function SupplyChainAnalyzer() {
  const [analysisType, setAnalysisType] = useState('shipment');
  const [formData, setFormData] = useState({
    // Shipment
    scheduled_days: 3,
    quantity: 1,
    sales_per_customer: 200,
    shipping_mode: 'Standard Class',
    market: 'USCA',
    customer_segment: 'Consumer',
    product: 'Electronics',
    
    // Demand Forecast
    forecast_period: 30,
    season: 'normal',
    
    // Supplier
    supplier_name: 'Supplier A',
    on_time_rate: 0.85,
    quality_score: 0.90,
    defect_rate: 0.05,
    cost_index: 0.85,
    
    // Route
    origin: 'Mumbai',
    destination: 'Bengaluru',
    distance: 350,
    weather: 'Clear',
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const shippingModes = ['First Class', 'Second Class', 'Standard Class', 'Same Day'];
  const markets = ['USCA', 'Europe', 'LATAM', 'Pacific Asia', 'Africa'];
  const customerSegments = ['Consumer', 'Corporate', 'Home Office'];
  const seasons = ['monsoon', 'normal', 'peak'];
  const weatherConditions = ['Clear', 'Cloudy', 'Rainy', 'Stormy', 'Fog'];
  const origins = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai'];
  const destinations = ['Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi', 'Chennai'];
  const products = ['Electronics', 'Apparel', 'Furniture', 'Food & Beverage', 'Chemicals', 'Hardware', 'Pharmaceuticals', 'Fragile Items'];

  const analysisOptions = [
    { id: 'shipment', label: '📦 Shipment Delay Prediction', description: 'Predict delivery delays' },
    { id: 'demand', label: '📈 Demand Forecast', description: '30-day demand prediction' },
    { id: 'supplier', label: '👥 Supplier Risk Analysis', description: 'Evaluate supplier performance' },
    { id: 'route', label: '🛣️ Route Optimization', description: 'Optimize delivery routes' },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: isNaN(value) ? value : parseFloat(value),
    });
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let response;
      switch (analysisType) {
        case 'shipment':
          response = await axios.post(`${API_BASE_URL}/delay-prediction/predict`, {
            scheduled_days: formData.scheduled_days,
            quantity: formData.quantity,
            sales_per_customer: formData.sales_per_customer,
            shipping_mode: formData.shipping_mode,
            market: formData.market,
            customer_segment: formData.customer_segment,
          });
          setResults({ type: 'shipment', data: response.data });
          break;

        case 'demand':
          response = await axios.post(`${API_BASE_URL}/demand-forecast`, {
            forecast_period: formData.forecast_period,
            season: formData.season,
          });
          setResults({ type: 'demand', data: response.data });
          break;

        case 'supplier':
          response = await axios.post(`${API_BASE_URL}/supplier-risk`, {
            supplier_data: [{
              name: formData.supplier_name,
              on_time_rate: formData.on_time_rate,
              quality_score: formData.quality_score,
              cost_index: formData.cost_index,
              defect_rate: formData.defect_rate,
            }],
          });
          setResults({ type: 'supplier', data: response.data });
          break;

        case 'route':
          response = await axios.post(`${API_BASE_URL}/delay-prediction`, {
            route_data: [{
              name: `${formData.origin} → ${formData.destination}`,
              distance: formData.distance,
              weather: formData.weather,
            }],
          });
          setResults({ type: 'route', data: response.data });
          break;

        default:
          setError('Invalid analysis type');
      }
    } catch (err) {
      setError(err.response?.data?.error || `Failed to perform ${analysisType} analysis`);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (probability) => {
    if (probability >= 0.7) return '#FF6B6B';
    if (probability >= 0.5) return '#FFA500';
    return '#4CAF50';
  };

  const getRiskLevel = (probability) => {
    if (probability >= 0.7) return '🔴 HIGH RISK';
    if (probability >= 0.5) return '🟠 MODERATE RISK';
    return '🟢 LOW RISK';
  };

  const renderForm = () => {
    switch (analysisType) {
      case 'shipment':
        return (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Scheduled Days for Delivery</label>
                <input
                  type="number"
                  name="scheduled_days"
                  value={formData.scheduled_days}
                  onChange={handleInputChange}
                  min="1"
                  max="20"
                />
              </div>
              <div className="form-group">
                <label>Order Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  max="1000"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Sales per Customer ($)</label>
                <input
                  type="number"
                  name="sales_per_customer"
                  value={formData.sales_per_customer}
                  onChange={handleInputChange}
                  min="10"
                  max="10000"
                  step="10"
                />
              </div>
              <div className="form-group">
                <label>Shipping Mode</label>
                <select
                  name="shipping_mode"
                  value={formData.shipping_mode}
                  onChange={handleInputChange}
                >
                  {shippingModes.map((mode) => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Market</label>
                <select
                  name="market"
                  value={formData.market}
                  onChange={handleInputChange}
                >
                  {markets.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Customer Segment</label>
                <select
                  name="customer_segment"
                  value={formData.customer_segment}
                  onChange={handleInputChange}
                >
                  {customerSegments.map((seg) => (
                    <option key={seg} value={seg}>{seg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Product Type</label>
                <select
                  name="product"
                  value={formData.product}
                  onChange={handleInputChange}
                >
                  {products.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        );

      case 'demand':
        return (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Forecast Period (Days)</label>
                <input
                  type="number"
                  name="forecast_period"
                  value={formData.forecast_period}
                  onChange={handleInputChange}
                  min="1"
                  max="90"
                />
              </div>
              <div className="form-group">
                <label>Season</label>
                <select
                  name="season"
                  value={formData.season}
                  onChange={handleInputChange}
                >
                  {seasons.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        );

      case 'supplier':
        return (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Supplier Name</label>
                <input
                  type="text"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>On-Time Rate (0-1)</label>
                <input
                  type="number"
                  name="on_time_rate"
                  value={formData.on_time_rate}
                  onChange={handleInputChange}
                  min="0"
                  max="1"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Quality Score (0-1)</label>
                <input
                  type="number"
                  name="quality_score"
                  value={formData.quality_score}
                  onChange={handleInputChange}
                  min="0"
                  max="1"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Defect Rate (0-1)</label>
                <input
                  type="number"
                  name="defect_rate"
                  value={formData.defect_rate}
                  onChange={handleInputChange}
                  min="0"
                  max="1"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Cost Index (0-1)</label>
                <input
                  type="number"
                  name="cost_index"
                  value={formData.cost_index}
                  onChange={handleInputChange}
                  min="0"
                  max="1"
                  step="0.01"
                />
              </div>
            </div>
          </>
        );

      case 'route':
        return (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Origin</label>
                <select
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                >
                  {origins.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Destination</label>
                <select
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                >
                  {destinations.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Distance (km)</label>
                <input
                  type="number"
                  name="distance"
                  value={formData.distance}
                  onChange={handleInputChange}
                  min="10"
                  max="3000"
                />
              </div>
              <div className="form-group">
                <label>Weather</label>
                <select
                  name="weather"
                  value={formData.weather}
                  onChange={handleInputChange}
                >
                  {weatherConditions.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!results) return null;

    const { type, data } = results;

    switch (type) {
      case 'shipment':
        return (
          <div className="results-section">
            <h3>📦 Shipment Delay Prediction Results</h3>
            <div className="risk-card" style={{ borderTopColor: getRiskColor(data.delay_probability) }}>
              <div className="risk-header">
                <div className="risk-indicator" style={{ backgroundColor: getRiskColor(data.delay_probability) }}>
                  {Math.round(data.delay_probability_percentage || (data.delay_probability * 100))}%
                </div>
                <div>
                  <h4>Delay Probability</h4>
                  <p className="risk-level">{getRiskLevel(data.delay_probability)}</p>
                </div>
              </div>

              <div className="prediction-details">
                <div className="detail-item">
                  <span>Expected Delay:</span>
                  <strong>{data.expected_delay} days</strong>
                </div>
                <div className="detail-item">
                  <span>Confidence:</span>
                  <strong>{Math.round(data.confidence * 100)}%</strong>
                </div>
              </div>

              {data.recommendations && (
                <div className="recommendations-box">
                  <h5>📋 Recommendations</h5>
                  <ul>
                    {data.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );

      case 'demand':
        return (
          <div className="results-section">
            <h3>📈 Demand Forecast Results</h3>
            <div className="analysis-card">
              <div className="analysis-header">
                <TrendingUp size={24} style={{ color: '#0066ff' }} />
                <h4>30-Day Demand Prediction</h4>
              </div>
              <div className="metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">Avg Daily Demand</span>
                  <span className="metric-value">{data.forecast?.avg_demand || 2500}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Model Accuracy</span>
                  <span className="metric-value">{(data.model_accuracy * 100).toFixed(0)}%</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Period</span>
                  <span className="metric-value">{data.forecast?.period || 30}d</span>
                </div>
              </div>
              
              {data.forecast?.season && (
                <div className="forecast-info">
                  <p>Season: <strong>{data.forecast.season.charAt(0).toUpperCase() + data.forecast.season.slice(1)}</strong></p>
                  <p style={{fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px'}}>
                    Forecasted demand for the selected period with seasonal adjustments applied.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'supplier':
        return (
          <div className="results-section">
            <h3>👥 Supplier Risk Analysis</h3>
            <div className="analysis-card">
              <div className="analysis-header">
                <Users size={24} style={{ color: '#FFA500' }} />
                <h4>Supplier Performance Metrics</h4>
              </div>
              <div className="metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">High Risk</span>
                  <span className="metric-value">{data.high_risk_count || 0}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Medium Risk</span>
                  <span className="metric-value">{data.medium_risk_count || 0}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Low Risk</span>
                  <span className="metric-value">{data.low_risk_count || 1}</span>
                </div>
              </div>
              
              {data.suppliers && data.suppliers.length > 0 && (
                <div className="suppliers-list">
                  <h5>Suppliers</h5>
                  {data.suppliers.map((sup, idx) => (
                    <div key={idx} className="supplier-item">
                      <div className="supplier-name">{sup.name}</div>
                      <div className="supplier-metrics">
                        <span>Risk: <strong style={{color: sup.risk_level === 'High' ? '#FF6B6B' : sup.risk_level === 'Medium' ? '#FFA500' : '#4CAF50'}}>{sup.risk_level}</strong></span>
                        <span>Score: <strong>{sup.risk_score}%</strong></span>
                        <span>On-time: <strong>{sup.on_time_rate}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'route':
        return (
          <div className="results-section">
            <h3>🛣️ Route Optimization Results</h3>
            <div className="analysis-card">
              <div className="analysis-header">
                <Zap size={24} style={{ color: '#4CAF50' }} />
                <h4>Route Performance Analysis</h4>
              </div>
              <div className="metrics-grid">
                <div className="metric-box">
                  <span className="metric-label">High Risk Routes</span>
                  <span className="metric-value">{data.high_risk_routes || 0}</span>
                </div>
                <div className="metric-box">
                  <span className="metric-label">Total Routes</span>
                  <span className="metric-value">{data.routes?.length || 0}</span>
                </div>
              </div>
              
              {data.routes && data.routes.length > 0 && (
                <div className="routes-list">
                  <h5>Route Analysis</h5>
                  {data.routes.map((route, idx) => (
                    <div key={idx} className="route-item">
                      <div className="route-info">
                        <div className="route-name">{route.name}</div>
                        <div className="route-details">
                          <span>Distance: <strong>{route.distance}km</strong></span>
                          <span>Weather: <strong>{route.weather}</strong></span>
                        </div>
                      </div>
                      <div className="route-risk" style={{color: route.risk_level === 'High' ? '#FF6B6B' : route.risk_level === 'Medium' ? '#FFA500' : '#4CAF50'}}>
                        <div style={{fontSize: '12px'}}>{route.risk_level} Risk</div>
                        <div style={{fontSize: '16px', fontWeight: 'bold'}}>{Math.round(route.delay_probability * 100)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="supply-chain-analyzer">
      <div className="analyzer-container">
        <h2>🔍 Supply Chain Analyzer</h2>
        <p className="subtitle">Analyze and predict across your entire supply chain</p>

        <div className="analyzer-grid">
          {/* Analysis Type Selection */}
          <div className="analysis-types">
            <h3>Select Analysis Type</h3>
            <div className="type-buttons">
              {analysisOptions.map((option) => (
                <button
                  key={option.id}
                  className={`type-button ${analysisType === option.id ? 'active' : ''}`}
                  onClick={() => {
                    setAnalysisType(option.id);
                    setResults(null);
                  }}
                >
                  <div className="button-label">{option.label}</div>
                  <div className="button-description">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Section */}
          <div className="form-section">
            <h3>Input Parameters</h3>
            <div className="form-content">
              {renderForm()}
              <button
                className="analyze-button"
                onClick={handleAnalyze}
                disabled={loading}
              >
                {loading ? '⏳ Analyzing...' : '🔍 Analyze'}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="results-container">
            {error && (
              <div className="error-box">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {!results && !error && !loading && (
              <div className="empty-state">
                <BarChart3 size={48} />
                <p>Select an analysis type and enter parameters to get started</p>
              </div>
            )}

            {renderResults()}
          </div>
        </div>
      </div>
    </div>
  );
}
