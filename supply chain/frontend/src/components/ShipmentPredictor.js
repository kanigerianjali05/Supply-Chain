import React, { useState } from 'react';
import axios from 'axios';
import { AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';
import './ShipmentPredictor.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function ShipmentPredictor() {
  const [formData, setFormData] = useState({
    scheduled_days: 3,
    quantity: 1,
    sales_per_customer: 200,
    shipping_mode: 'Standard Class',
    market: 'Maharashtra',
    customer_segment: 'Consumer',
    product: 'Electronics',
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const shippingModes = ['First Class', 'Second Class', 'Standard Class', 'Same Day'];
  const markets = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
    'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 
    'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 
    'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 
    'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 
    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];
  const customerSegments = ['Consumer', 'Corporate', 'Home Office'];
  const products = ['Electronics', 'Apparel', 'Furniture', 'Food & Beverage', 'Chemicals', 'Hardware', 'Pharmaceuticals', 'Fragile Items'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: isNaN(value) ? value : parseFloat(value),
    });
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/delay-prediction/predict`,
        formData
      );

      setPrediction(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get prediction');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (probability) => {
    // Handle both percentage (0-100) and decimal (0-1) formats
    const prob = probability > 1 ? probability / 100 : probability;
    if (prob >= 0.7) return '#FF6B6B';
    if (prob >= 0.5) return '#FFA500';
    return '#4CAF50';
  };

  const getRiskLevel = (probability) => {
    // Handle both percentage (0-100) and decimal (0-1) formats
    const prob = probability > 1 ? probability / 100 : probability;
    if (prob >= 0.7) return '🔴 HIGH RISK';
    if (prob >= 0.5) return '🟠 MODERATE RISK';
    return '🟢 LOW RISK';
  };

  return (
    <div className="shipment-predictor">
      <div className="predictor-container">
        <h2>📦 Shipment Delay Predictor</h2>
        <p className="subtitle">Get real-time delay predictions based on historical data</p>

        <div className="predictor-grid">
          {/* Input Form */}
          <div className="form-section">
            <h3>Enter Shipment Details</h3>
            
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
              <small>Expected delivery timeframe in days</small>
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
              <small>Number of items in order</small>
            </div>

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
              <small>Customer order value in currency (e.g., ₹200 = 200)</small>
            </div>

            <div className="form-group">
              <label>Shipping Mode</label>
              <select
                name="shipping_mode"
                value={formData.shipping_mode}
                onChange={handleInputChange}
              >
                {shippingModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
              <small>Select shipping method</small>
            </div>

            <div className="form-group">
              <label>Market Region</label>
              <select
                name="market"
                value={formData.market}
                onChange={handleInputChange}
              >
                {markets.map((market) => (
                  <option key={market} value={market}>
                    {market}
                  </option>
                ))}
              </select>
              <small>Geographic delivery region</small>
            </div>

            <div className="form-group">
              <label>Customer Segment</label>
              <select
                name="customer_segment"
                value={formData.customer_segment}
                onChange={handleInputChange}
              >
                {customerSegments.map((segment) => (
                  <option key={segment} value={segment}>
                    {segment}
                  </option>
                ))}
              </select>
              <small>Type of customer</small>
            </div>

            <div className="form-group">
              <label>Product Type</label>
              <select
                name="product"
                value={formData.product}
                onChange={handleInputChange}
              >
                {products.map((product) => (
                  <option key={product} value={product}>
                    {product}
                  </option>
                ))}
              </select>
              <small>Type of product being shipped</small>
            </div>

            <button
              className="predict-button"
              onClick={handlePredict}
              disabled={loading}
            >
              {loading ? '⏳ Analyzing...' : '🔍 Predict Delay'}
            </button>
          </div>

          {/* Results */}
          <div className="results-section">
            {error && (
              <div className="error-box">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {prediction && (
              <div className="prediction-results">
                <div className="risk-card" style={{ borderTopColor: getRiskColor(prediction.delay_probability_percentage) }}>
                  <div className="risk-header">
                    <div className="risk-indicator" style={{ backgroundColor: getRiskColor(prediction.delay_probability_percentage) }}>
                      {Math.round(prediction.delay_probability_percentage)}%
                    </div>
                    <div>
                      <h4>Final Delay Probability</h4>
                      <p className="risk-level">{getRiskLevel(prediction.delay_probability)}</p>
                      <small style={{ color: '#666', marginTop: '4px' }}>
                        📊 {prediction.prediction_method}
                      </small>
                    </div>
                  </div>

                  <div className="prediction-details">
                    <div className="detail-item">
                      <span className="label">Confidence Score:</span>
                      <span className="value">{Math.round(prediction.confidence)}%</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Expected Delay:</span>
                      <span className="value">{prediction.expected_delay?.toFixed(2) || 'N/A'} days</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Pattern Consistency:</span>
                      <span className="value">{prediction.pattern_consistency_score?.toFixed(1) || 'N/A'}%</span>
                    </div>
                  </div>
                </div>

                {/* HYBRID PREDICTION BREAKDOWN */}
                {prediction.prediction_breakdown && (
                  <div className="breakdown-box" style={{ marginTop: '16px', padding: '14px', backgroundColor: '#F8FAFB', borderRadius: '8px', border: '1px solid #E8EAED' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>🔬 Prediction Breakdown</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ padding: '10px', backgroundColor: '#E3F2FD', borderRadius: '6px', borderLeft: '3px solid #2196F3' }}>
                        <div style={{ fontSize: '12px', color: '#1565C0', fontWeight: '600' }}>ML Model Prediction</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0D47A1' }}>
                          {prediction.prediction_breakdown.ml_model_prediction_percentage?.toFixed(1)}%
                        </div>
                        <div style={{ fontSize: '11px', color: '#424242', marginTop: '4px' }}>Weight: {(prediction.adjustment_factors.ml_model_weight * 100).toFixed(0)}%</div>
                      </div>
                      
                      <div style={{ padding: '10px', backgroundColor: '#F3E5F5', borderRadius: '6px', borderLeft: '3px solid #9C27B0' }}>
                        <div style={{ fontSize: '12px', color: '#6A1B9A', fontWeight: '600' }}>Historical Data Average</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4A148C' }}>
                          {prediction.prediction_breakdown.historical_patterns_average_percentage?.toFixed(1)}%
                        </div>
                        <div style={{ fontSize: '11px', color: '#424242', marginTop: '4px' }}>Weight: {(prediction.adjustment_factors.historical_data_weight * 100).toFixed(0)}%</div>
                      </div>
                    </div>

                    <div style={{ padding: '10px', backgroundColor: '#FFF3E0', borderRadius: '6px', marginBottom: '12px' }}>
                      <h5 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>📍 Historical Delay Rates by Category</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '12px' }}>
                        <div>
                          <strong>Shipping Mode:</strong><br/>{prediction.prediction_breakdown.shipping_mode_delay_rate?.toFixed(1)}%
                        </div>
                        <div>
                          <strong>Market:</strong><br/>{prediction.prediction_breakdown.market_delay_rate?.toFixed(1)}%
                        </div>
                        <div>
                          <strong>Customer Segment:</strong><br/>{prediction.prediction_breakdown.segment_delay_rate?.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {prediction.adjustment_factors && (
                      <div style={{ padding: '10px', backgroundColor: '#E8F5E9', borderRadius: '6px' }}>
                        <h5 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>⚙️ Your Input Adjustments</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '12px' }}>
                          <div>
                            <strong>Schedule Factor:</strong><br/>
                            <span style={{ color: prediction.adjustment_factors.schedule_factor < 1 ? '#2E7D32' : '#999' }}>
                              {prediction.adjustment_factors.schedule_factor < 1 ? '✓ Reduces risk' : '→ Neutral'}
                            </span>
                          </div>
                          <div>
                            <strong>Quantity Factor:</strong><br/>
                            <span style={{ color: prediction.adjustment_factors.quantity_factor < 1 ? '#2E7D32' : '#999' }}>
                              {prediction.adjustment_factors.quantity_factor < 1 ? '✓ Reduces risk' : '→ Neutral'}
                            </span>
                          </div>
                          <div>
                            <strong>Sales Factor:</strong><br/>
                            <span style={{ color: prediction.adjustment_factors.sales_factor < 1 ? '#2E7D32' : '#999' }}>
                              {prediction.adjustment_factors.sales_factor < 1 ? '✓ Reduces risk' : '→ Neutral'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {prediction.recommendations && (
                  <div className="recommendations-box">
                    <h4>📋 Recommendations</h4>
                    <ul>
                      {prediction.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Historical Insights */}
                {prediction.historical_insight && (
                  <div className="insights-box">
                    <TrendingUp size={18} />
                    <div>
                      <h5>Analysis Details</h5>
                      <p style={{ whiteSpace: 'pre-wrap', fontSize: '12px', lineHeight: '1.5' }}>
                        {prediction.historical_insight}
                      </p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {(prediction.delay_probability_percentage || prediction.delay_probability) < 50 && (
                  <div className="success-box">
                    <CheckCircle size={18} />
                    <span>Good news! Low risk of delay on this shipment</span>
                  </div>
                )}
              </div>
            )}

            {!prediction && !error && !loading && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <p>Fill in the shipment details and click "Predict Delay" to get analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
