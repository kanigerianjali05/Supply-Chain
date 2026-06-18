import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, TrendingUp, Users, Zap, RefreshCw } from 'lucide-react';
import './DynamicSupplyChainAnalyzer.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function DynamicSupplyChainAnalyzer() {
  const [inputs, setInputs] = useState({
    // General
    timeframe: 30,
    target_market: 'USCA',
    product: 'Electronics',
    
    // Shipment
    scheduled_days: 3,
    order_quantity: 100,
    sales_per_customer: 200,
    shipping_mode: 'Standard Class',
    customer_segment: 'Consumer',
    
    // Demand
    season: 'normal',
    
    // Supplier
    supplier_on_time_rate: 0.85,
    supplier_quality: 0.90,
    supplier_defect: 0.05,
    
    // Route
    route_distance: 350,
    weather: 'Clear',
  });

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const shippingModes = ['First Class', 'Second Class', 'Standard Class', 'Same Day'];
  const markets = ['USCA', 'Europe', 'LATAM', 'Pacific Asia', 'Africa'];
  const customerSegments = ['Consumer', 'Corporate', 'Home Office'];
  const seasons = ['monsoon', 'normal', 'peak'];
  const weatherConditions = ['Clear', 'Cloudy', 'Rainy', 'Stormy', 'Fog'];
  const products = ['Electronics', 'Apparel', 'Furniture', 'Food & Beverage', 'Chemicals', 'Hardware', 'Pharmaceuticals', 'Fragile Items'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs({
      ...inputs,
      [name]: isNaN(value) ? value : parseFloat(value),
    });
  };

  const generateDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get all predictions
      const [shipmentRes, demandRes, supplierRes, routeRes] = await Promise.all([
        axios.post(`${API_BASE_URL}/delay-prediction/predict`, {
          scheduled_days: inputs.scheduled_days,
          quantity: inputs.order_quantity,
          sales_per_customer: inputs.sales_per_customer,
          shipping_mode: inputs.shipping_mode,
          market: inputs.target_market,
          customer_segment: inputs.customer_segment,
        }),
        axios.post(`${API_BASE_URL}/demand-forecast`, {
          forecast_period: inputs.timeframe,
          season: inputs.season,
        }),
        axios.post(`${API_BASE_URL}/supplier-risk`, {
          supplier_data: [{
            name: 'Selected Supplier',
            on_time_rate: inputs.supplier_on_time_rate,
            quality_score: inputs.supplier_quality,
            cost_index: 0.85,
            defect_rate: inputs.supplier_defect,
          }],
        }),
        axios.post(`${API_BASE_URL}/delay-prediction`, {
          route_data: [{
            name: `Route Analysis`,
            distance: inputs.route_distance,
            weather: inputs.weather,
          }],
        }),
      ]);

      // Calculate aggregate metrics
      const delayRisk = Math.round(shipmentRes.data.delay_probability_percentage || 50);
      const onTimeDelivery = 100 - delayRisk;
      const avgDemand = demandRes.data.forecast?.avg_demand || 2500;
      const supplierRisk = supplierRes.data.suppliers?.[0]?.risk_score || 50;

      setDashboardData({
        metrics: {
          delay_risk: delayRisk,
          on_time_delivery: onTimeDelivery,
          supply_chain_efficiency: 100 - (delayRisk * 0.5 + supplierRisk * 0.3) / 80,
          forecast_accuracy: 91,
        },
        shipment: shipmentRes.data,
        demand: demandRes.data,
        supplier: supplierRes.data,
        route: routeRes.data,
        summary: {
          avg_demand: avgDemand,
          supplier_risk: supplierRisk,
          routes_analyzed: routeRes.data.routes?.length || 0,
          high_risk_routes: routeRes.data.high_risk_routes || 0,
        }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate dashboard');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dynamic-analyzer">
      <div className="analyzer-wrapper">
        {/* Input Panel */}
        <div className="input-panel">
          <h2>⚙️ Configure Analysis</h2>
          
          <div className="input-section">
            <h4>General Settings</h4>
            <div className="form-group">
              <label>Forecast Timeframe (Days)</label>
              <input
                type="number"
                name="timeframe"
                value={inputs.timeframe}
                onChange={handleInputChange}
                min="1"
                max="90"
              />
            </div>
            <div className="form-group">
              <label>Target Market</label>
              <select name="target_market" value={inputs.target_market} onChange={handleInputChange}>
                {markets.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Product Type</label>
              <select name="product" value={inputs.product} onChange={handleInputChange}>
                {products.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-section">
            <h4>Shipment Parameters</h4>
            <div className="form-group">
              <label>Scheduled Days</label>
              <input
                type="number"
                name="scheduled_days"
                value={inputs.scheduled_days}
                onChange={handleInputChange}
                min="1"
                max="30"
              />
            </div>
            <div className="form-group">
              <label>Order Quantity</label>
              <input
                type="number"
                name="order_quantity"
                value={inputs.order_quantity}
                onChange={handleInputChange}
                min="1"
                max="1000"
              />
            </div>
            <div className="form-group">
              <label>Sales Value ($)</label>
              <input
                type="number"
                name="sales_per_customer"
                value={inputs.sales_per_customer}
                onChange={handleInputChange}
                min="10"
                max="10000"
                step="10"
              />
            </div>
            <div className="form-group">
              <label>Shipping Mode</label>
              <select name="shipping_mode" value={inputs.shipping_mode} onChange={handleInputChange}>
                {shippingModes.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Customer Segment</label>
              <select name="customer_segment" value={inputs.customer_segment} onChange={handleInputChange}>
                {customerSegments.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-section">
            <h4>Demand & Supplier</h4>
            <div className="form-group">
              <label>Season</label>
              <select name="season" value={inputs.season} onChange={handleInputChange}>
                {seasons.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Supplier On-Time Rate</label>
              <input
                type="number"
                name="supplier_on_time_rate"
                value={inputs.supplier_on_time_rate}
                onChange={handleInputChange}
                min="0"
                max="1"
                step="0.05"
              />
            </div>
            <div className="form-group">
              <label>Supplier Quality Score</label>
              <input
                type="number"
                name="supplier_quality"
                value={inputs.supplier_quality}
                onChange={handleInputChange}
                min="0"
                max="1"
                step="0.05"
              />
            </div>
            <div className="form-group">
              <label>Defect Rate</label>
              <input
                type="number"
                name="supplier_defect"
                value={inputs.supplier_defect}
                onChange={handleInputChange}
                min="0"
                max="1"
                step="0.05"
              />
            </div>
          </div>

          <div className="input-section">
            <h4>Route Analysis</h4>
            <div className="form-group">
              <label>Distance (km)</label>
              <input
                type="number"
                name="route_distance"
                value={inputs.route_distance}
                onChange={handleInputChange}
                min="10"
                max="3000"
              />
            </div>
            <div className="form-group">
              <label>Weather Condition</label>
              <select name="weather" value={inputs.weather} onChange={handleInputChange}>
                {weatherConditions.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="generate-button"
            onClick={generateDashboard}
            disabled={loading}
          >
            {loading ? '⏳ Generating...' : '🚀 Generate Dashboard'}
          </button>
        </div>

        {/* Dashboard Panel */}
        <div className="dashboard-panel">
          {error && (
            <div className="error-box">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {!dashboardData && !error && !loading && (
            <div className="empty-state">
              <div className="empty-content">
                <h3>📊 Configure & Generate</h3>
                <p>Adjust parameters on the left and click "Generate Dashboard"</p>
                <p style={{ fontSize: '12px', marginTop: '15px', color: 'var(--text-secondary)' }}>
                  The system will analyze your inputs and display comprehensive supply chain metrics
                </p>
              </div>
            </div>
          )}

          {dashboardData && (
            <div className="dashboard-content">
              {/* KPI Cards */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-value" style={{ color: '#FF6B6B' }}>
                    {Math.round(dashboardData.metrics.delay_risk)}%
                  </div>
                  <div className="kpi-label">Delay Risk</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-value" style={{ color: '#4CAF50' }}>
                    {Math.round(dashboardData.metrics.on_time_delivery)}%
                  </div>
                  <div className="kpi-label">On-Time Delivery</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-value" style={{ color: '#0066ff' }}>
                    {Math.round(dashboardData.metrics.supply_chain_efficiency)}%
                  </div>
                  <div className="kpi-label">Supply Chain Efficiency</div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-value" style={{ color: '#FFA500' }}>
                    {dashboardData.metrics.forecast_accuracy}%
                  </div>
                  <div className="kpi-label">Forecast Accuracy</div>
                </div>
              </div>

              {/* Results Grid */}
              <div className="results-grid">
                {/* Shipment Analysis */}
                <div className="result-card">
                  <h4>📦 Shipment Analysis</h4>
                  <div className="metric-item">
                    <span>Delay Probability:</span>
                    <strong style={{color: dashboardData.shipment.risk_level === 'High' ? '#FF6B6B' : dashboardData.shipment.risk_level === 'Moderate' ? '#FFA500' : '#4CAF50'}}>
                      {Math.round(dashboardData.shipment.delay_probability_percentage || (dashboardData.shipment.delay_probability * 100))}%
                    </strong>
                  </div>
                  <div className="metric-item">
                    <span>Risk Level:</span>
                    <strong>{dashboardData.shipment.risk_level}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Expected Delay:</span>
                    <strong>{dashboardData.shipment.expected_delay} days</strong>
                  </div>
                </div>

                {/* Demand Forecast */}
                <div className="result-card">
                  <h4>📈 Demand Forecast</h4>
                  <div className="metric-item">
                    <span>Avg Daily Demand:</span>
                    <strong>{dashboardData.summary.avg_demand} units</strong>
                  </div>
                  <div className="metric-item">
                    <span>Period:</span>
                    <strong>{inputs.timeframe} days</strong>
                  </div>
                  <div className="metric-item">
                    <span>Season:</span>
                    <strong>{inputs.season.charAt(0).toUpperCase() + inputs.season.slice(1)}</strong>
                  </div>
                  <div className="metric-item">
                    <span>Model Accuracy:</span>
                    <strong>{(dashboardData.demand.model_accuracy * 100).toFixed(0)}%</strong>
                  </div>
                </div>

                {/* Supplier Analysis */}
                <div className="result-card">
                  <h4>👥 Supplier Analysis</h4>
                  <div className="metric-item">
                    <span>Risk Score:</span>
                    <strong style={{color: dashboardData.summary.supplier_risk > 50 ? '#FF6B6B' : dashboardData.summary.supplier_risk > 30 ? '#FFA500' : '#4CAF50'}}>
                      {dashboardData.summary.supplier_risk.toFixed(1)}%
                    </strong>
                  </div>
                  <div className="metric-item">
                    <span>On-Time Rate:</span>
                    <strong>{(inputs.supplier_on_time_rate * 100).toFixed(0)}%</strong>
                  </div>
                  <div className="metric-item">
                    <span>Quality Score:</span>
                    <strong>{(inputs.supplier_quality * 100).toFixed(0)}%</strong>
                  </div>
                </div>

                {/* Route Analysis */}
                <div className="result-card">
                  <h4>🛣️ Route Analysis</h4>
                  <div className="metric-item">
                    <span>Routes Analyzed:</span>
                    <strong>{dashboardData.summary.routes_analyzed}</strong>
                  </div>
                  <div className="metric-item">
                    <span>High-Risk Routes:</span>
                    <strong style={{color: dashboardData.summary.high_risk_routes > 0 ? '#FF6B6B' : '#4CAF50'}}>
                      {dashboardData.summary.high_risk_routes}
                    </strong>
                  </div>
                  <div className="metric-item">
                    <span>Distance:</span>
                    <strong>{inputs.route_distance} km</strong>
                  </div>
                  <div className="metric-item">
                    <span>Weather:</span>
                    <strong>{inputs.weather}</strong>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {dashboardData.shipment.recommendations && (
                <div className="recommendations-panel">
                  <h4>💡 Key Recommendations</h4>
                  <ul>
                    {dashboardData.shipment.recommendations.slice(0, 3).map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
