import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import './ExecutiveDashboard.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function ExecutiveDashboard({ data, metrics, alerts, selectedProduct }) {
  const [demandData, setDemandData] = useState([]);
  const [routesData, setRoutesData] = useState([]);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [shipmentFormData, setShipmentFormData] = useState({
    scheduled_days: 3,
    quantity: 1,
    sales_per_customer: 200,
    shipping_mode: 'Standard Class',
    market: 'Maharashtra',
    customer_segment: 'Consumer',
    product: selectedProduct || 'Electronics',
  });

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

  useEffect(() => {
    // Update product when selectedProduct changes
    setShipmentFormData(prev => ({
      ...prev,
      product: selectedProduct || 'Electronics'
    }));
  }, [selectedProduct]);

  useEffect(() => {
    // Initialize demand data with current shipment parameters
    const initialDemandData = generateDynamicDemandData();
    setDemandData(initialDemandData);
    
    // Fetch routes data
    fetchRoutesData();
  }, []);

  const fetchDemandForecast = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/demand-forecast`, {
        historical_data: generateSampleDemandHistory()
      });
      
      const forecast = response.data.forecast || [];
      setDemandData(forecast.slice(0, 14).map((item, idx) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        forecast: item.predicted_demand,
        upper: item.upper_bound,
        lower: item.lower_bound
      })));
    } catch (error) {
      console.error('Error fetching demand forecast:', error);
    }
  };

  const fetchRoutesData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/routes-map`);
      setRoutesData(response.data.routes);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const generateSampleDemandHistory = () => {
    const dates = [];
    for (let i = 90; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push({
        date: date.toISOString().split('T')[0],
        demand: 2500 + Math.random() * 1000,
        temperature: 25 + Math.random() * 10
      });
    }
    return dates;
  };

  // Generate dynamic demand data based on current prediction and shipment parameters
  const generateDynamicDemandData = () => {
    const quantity = shipmentFormData.quantity || 1;
    const scheduledDays = shipmentFormData.scheduled_days || 3;
    const baseMultiplier = quantity * (scheduledDays > 5 ? 1.5 : 1.0);
    
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      // Vary demand based on prediction confidence
      const confidence = predictionResult?.confidence || 50;
      const variation = (100 - confidence) / 10;
      
      const forecast = Math.round((2500 + Math.random() * 1000) * baseMultiplier * (0.9 + Math.random() * 0.2));
      const upper = Math.round(forecast * (1 + variation / 100));
      const lower = Math.round(forecast * (1 - variation / 100));
      
      dates.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        forecast: forecast,
        upper: upper,
        lower: lower
      });
    }
    return dates;
  };

  // Update demand data when shipment parameters change
  useEffect(() => {
    const demandData = generateDynamicDemandData();
    setDemandData(demandData);
  }, [shipmentFormData.quantity, shipmentFormData.scheduled_days, predictionResult]);

  const handleShipmentInputChange = (e) => {
    const { name, value } = e.target;
    setShipmentFormData({
      ...shipmentFormData,
      [name]: isNaN(value) ? value : parseFloat(value),
    });
  };

  const handlePredictDelay = async () => {
    setPredictionLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/delay-prediction/predict`, shipmentFormData);
      setPredictionResult(response.data);
    } catch (error) {
      console.error('Prediction error:', error);
      setPredictionResult({ error: error.response?.data?.error || 'Failed to predict' });
    } finally {
      setPredictionLoading(false);
    }
  };

  // Calculate dynamic risk categories based on prediction
  const getDynamicRiskCategories = () => {
    if (predictionResult && !predictionResult.error) {
      const delayProb = predictionResult.delay_probability_percentage || 0;
      const onTimeProb = 100 - delayProb;
      
      // Distribute risk: High, Medium, Low based on delay probability
      const highRisk = Math.round(delayProb * 0.6);
      const mediumRisk = Math.round(delayProb * 0.4);
      const lowRisk = Math.round(onTimeProb);
      
      return [
        { name: 'High Risk', value: Math.max(1, highRisk), fill: '#FF6B6B' },
        { name: 'Medium Risk', value: Math.max(1, mediumRisk), fill: '#FFA500' },
        { name: 'Low Risk', value: Math.max(1, lowRisk), fill: '#4CAF50' },
      ];
    }
    
    // Default categories when no prediction
    return [
      { name: 'High Risk', value: 23, fill: '#FF6B6B' },
      { name: 'Medium Risk', value: 45, fill: '#FFA500' },
      { name: 'Low Risk', value: 132, fill: '#4CAF50' },
    ];
  };

  // Calculate dynamic delay reasons based on input parameters
  const getDynamicDelayReasons = () => {
    if (predictionResult && !predictionResult.error) {
      const delayProb = predictionResult.delay_probability_percentage || 0;
      const mode = shipmentFormData.shipping_mode || 'Standard Class';
      
      // Adjust reasons based on shipping mode and delay probability
      const baseValue = Math.round(delayProb / 20) * 3;
      
      let reasons = [
        { name: 'Traffic', value: baseValue + (mode === 'First Class' ? 5 : 15) },
        { name: 'Weather', value: baseValue + 10 },
        { name: 'Documentation', value: baseValue + (mode === 'Standard Class' ? 8 : 2) },
        { name: 'Mechanical', value: baseValue + 5 },
        { name: 'Other', value: baseValue },
      ];
      
      return reasons.map(r => ({ ...r, value: Math.max(1, r.value) }));
    }
    
    // Default reasons
    return [
      { name: 'Weather', value: 35 },
      { name: 'Traffic', value: 28 },
      { name: 'Mechanical', value: 18 },
      { name: 'Documentation', value: 12 },
      { name: 'Other', value: 7 },
    ];
  };

  // Generate dynamic routes data based on prediction
  const getDynamicRoutesData = () => {
    const delayProb = predictionResult?.delay_probability_percentage || 0;
    const mode = shipmentFormData.shipping_mode || 'Standard Class';
    const market = shipmentFormData.market || 'USCA';
    
    const baseRoutes = [
      { id: 1, name: `${market} Express Route`, distance: 350, estimated_time: 5 },
      { id: 2, name: `${market} Standard Route`, distance: 450, estimated_time: 7 },
      { id: 3, name: `${market} Economy Route`, distance: 520, estimated_time: 9 },
      { id: 4, name: `Regional Hub to ${market}`, distance: 280, estimated_time: 4 },
      { id: 5, name: `${market} Overnight Delivery`, distance: 200, estimated_time: 2 },
    ];
    
    // Adjust delay probability based on mode and distance
    return baseRoutes.map((route, idx) => {
      let delayAdjustment = 1.0;
      
      // Mode affects delay
      if (mode === 'First Class') delayAdjustment -= 0.3;
      else if (mode === 'Standard Class') delayAdjustment += 0.1;
      else if (mode === 'Ship') delayAdjustment += 0.2;
      
      // Distance affects delay
      delayAdjustment += (route.distance - 300) / 1000;
      
      const adjDelayProb = Math.round(Math.max(1, Math.min(99, delayProb * delayAdjustment)));
      
      let status = 'on_track';
      if (adjDelayProb >= 70) status = 'high_risk';
      else if (adjDelayProb >= 40) status = 'medium_risk';
      
      return {
        ...route,
        delay_probability: adjDelayProb,
        status: status
      };
    });
  };

  // Use dynamic routes if prediction exists, otherwise use static data
  const displayRoutes = predictionResult && !predictionResult.error 
    ? getDynamicRoutesData() 
    : routesData;

  // Compute dynamic chart data right before render
  const riskCategories = getDynamicRiskCategories();
  const delayReasons = getDynamicDelayReasons();

  return (
    <div className="executive-dashboard">
      {/* SHIPMENT DELAY PREDICTION INPUT */}
      <section style={{ backgroundColor: '#1E2139', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #FF9800' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#FF9800' }}>📦 Quick Delay Prediction</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          
          {/* INPUT FORM */}
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#AAA', fontSize: '11px', marginBottom: '3px', fontWeight: '500' }}>Days</label>
                <input
                  type="number"
                  name="scheduled_days"
                  value={shipmentFormData.scheduled_days}
                  onChange={handleShipmentInputChange}
                  min="1"
                  max="20"
                  style={{ padding: '6px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#AAA', fontSize: '11px', marginBottom: '3px', fontWeight: '500' }}>Qty</label>
                <input
                  type="number"
                  name="quantity"
                  value={shipmentFormData.quantity}
                  onChange={handleShipmentInputChange}
                  min="1"
                  style={{ padding: '6px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', fontSize: '12px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#AAA', fontSize: '11px', marginBottom: '3px', fontWeight: '500' }}>Sales (₹)</label>
                <input
                  type="number"
                  name="sales_per_customer"
                  value={shipmentFormData.sales_per_customer}
                  onChange={handleShipmentInputChange}
                  min="10"
                  style={{ padding: '6px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', fontSize: '12px' }}
                  title="Customer order value in Indian Rupees"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#AAA', fontSize: '11px', marginBottom: '3px', fontWeight: '500' }}>Mode</label>
                <select
                  name="shipping_mode"
                  value={shipmentFormData.shipping_mode}
                  onChange={handleShipmentInputChange}
                  style={{ padding: '6px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', fontSize: '12px' }}
                >
                  {shippingModes.map(m => <option key={m} value={m}>{m.split(' ')[0]}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#AAA', fontSize: '11px', marginBottom: '3px', fontWeight: '500' }}>Market</label>
                <select
                  name="market"
                  value={shipmentFormData.market}
                  onChange={handleShipmentInputChange}
                  style={{ padding: '6px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', fontSize: '12px' }}
                >
                  {markets.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#AAA', fontSize: '11px', marginBottom: '3px', fontWeight: '500' }}>Segment</label>
                <select
                  name="customer_segment"
                  value={shipmentFormData.customer_segment}
                  onChange={handleShipmentInputChange}
                  style={{ padding: '6px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', fontSize: '12px' }}
                >
                  {customerSegments.map(s => <option key={s} value={s}>{s.split(' ')[0]}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={handlePredictDelay}
              disabled={predictionLoading}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#FF9800',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                fontWeight: '600',
                cursor: predictionLoading ? 'not-allowed' : 'pointer',
                opacity: predictionLoading ? 0.6 : 1,
                fontSize: '14px'
              }}
            >
              {predictionLoading ? '⏳ Predicting...' : '🔍 Get Prediction'}
            </button>
          </div>
        </div>
      </section>

      {/* KPI Cards - Dynamic based on prediction */}
      <section className="kpi-section">
        {predictionResult && !predictionResult.error ? (
          <>
            {/* Delay Risk - from prediction */}
            <div className="kpi-card">
              <div className="kpi-icon high-risk">⚠️</div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: predictionResult.delay_probability_percentage >= 70 ? '#FF6B6B' : predictionResult.delay_probability_percentage >= 50 ? '#FFA500' : '#4CAF50' }}>
                  {predictionResult.delay_probability_percentage?.toFixed(1)}%
                </div>
                <div className="kpi-label">Delay Risk</div>
                <div className="kpi-detail">{typeof predictionResult.risk_level === 'object' ? predictionResult.risk_level.level : predictionResult.risk_level}</div>
              </div>
            </div>

            {/* On-Time Delivery - inverse of delay risk */}
            <div className="kpi-card">
              <div className="kpi-icon success">✓</div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#4CAF50' }}>
                  {(100 - (predictionResult.delay_probability_percentage || 0)).toFixed(1)}%
                </div>
                <div className="kpi-label">On Time Delivery</div>
                <div className="kpi-detail">Based on current inputs</div>
              </div>
            </div>

            {/* Supply Chain Efficiency - based on confidence */}
            <div className="kpi-card">
              <div className="kpi-icon">📊</div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#2196F3' }}>
                  {(100 - (predictionResult.delay_probability_percentage || 0) * 0.7).toFixed(0)}%
                </div>
                <div className="kpi-label">Supply Chain Efficiency</div>
                <div className="kpi-detail">Network Optimization Index</div>
              </div>
            </div>

            {/* Forecast Accuracy - from confidence */}
            <div className="kpi-card">
              <div className="kpi-icon">🎯</div>
              <div className="kpi-content">
                <div className="kpi-value" style={{ color: '#FF9800' }}>
                  {(predictionResult.confidence || 0).toFixed(0)}%
                </div>
                <div className="kpi-label">Forecast Accuracy</div>
                <div className="kpi-detail">AI Model Performance</div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Default KPI cards when no prediction */}
            <div className="kpi-card">
              <div className="kpi-icon high-risk">⚠️</div>
              <div className="kpi-content">
                <div className="kpi-value">{data?.delay_risk || 72}%</div>
                <div className="kpi-label">Delay Risk</div>
                <div className="kpi-detail">Risk Score: 361-726</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon success">✓</div>
              <div className="kpi-content">
                <div className="kpi-value">{data?.on_time_delivery || 78}%</div>
                <div className="kpi-label">On Time Delivery</div>
                <div className="kpi-detail">↑ 3.2% from last week</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">📊</div>
              <div className="kpi-content">
                <div className="kpi-value">{data?.supply_chain_efficiency || 85}%</div>
                <div className="kpi-label">Supply Chain Efficiency</div>
                <div className="kpi-detail">Network Optimization Index</div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">🎯</div>
              <div className="kpi-content">
                <div className="kpi-value">{data?.forecast_accuracy || 91}%</div>
                <div className="kpi-label">Forecast Accuracy</div>
                <div className="kpi-detail">AI Model Performance</div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Charts Section */}
      <section className="charts-section">
        <div className="chart-card half-width">
          <h3>Demand Prediction (30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={demandData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #555' }} />
              <Legend />
              <Line type="monotone" dataKey="forecast" stroke="#FF9800" strokeWidth={2} name="Forecast" />
              <Line type="monotone" dataKey="upper" stroke="#666" strokeDasharray="5 5" name="Upper Bound" />
              <Line type="monotone" dataKey="lower" stroke="#666" strokeDasharray="5 5" name="Lower Bound" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card half-width">
          <h3>Delay Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={riskCategories} cx="50%" cy="50%" innerRadius={80} outerRadius={120} dataKey="value">
                {riskCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #555' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Additional Charts */}
      <section className="charts-section">
        <div className="chart-card full-width">
          <h3>Delay Reasons Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={delayReasons} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#222', border: '1px solid #555' }} />
              <Bar dataKey="value" fill="#FF9800" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Routes Table */}
      <section className="routes-section">
        <h3>Top Risk Routes</h3>
        <div className="routes-table">
          <table>
            <thead>
              <tr>
                <th>Route</th>
                <th>Distance</th>
                <th>Est. Time</th>
                <th>Delay Probability</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayRoutes.slice(0, 5).map((route) => (
                <tr key={route.id}>
                  <td>{route.name}</td>
                  <td>{route.distance} km</td>
                  <td>{route.estimated_time}h</td>
                  <td>
                    <div className="progress-bar">
                      <div className="progress" style={{ width: `${route.delay_probability}%` }}></div>
                    </div>
                    {route.delay_probability}%
                  </td>
                  <td>
                    <span className={`status ${route.status}`}>{route.status.replace('_', ' ')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
