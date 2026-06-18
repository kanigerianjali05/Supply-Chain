import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { TrendingUp, Download } from 'lucide-react';
import './DemandForecast.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function DemandForecast({ selectedProduct }) {
  const [forecastData, setForecastData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [factorsApplied, setFactorsApplied] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    forecast_period: 30,
    product_type: selectedProduct || 'Electronics',
    customer_segment: 'B2B',
    temperature: 25,
    humidity: 60,
    weather_condition: 'clear'
  });

  useEffect(() => {
    // Update product_type when selectedProduct changes
    setFormData(prev => ({
      ...prev,
      product_type: selectedProduct || 'Electronics'
    }));
  }, [selectedProduct]);

  const fetchForecast = async (dataToUse) => {
    try {
      setIsLoading(true);
      const historicalData = generateHistoricalData();
      
      // Use provided data or current formData
      const params = dataToUse || formData;
      
      const response = await axios.post(`${API_BASE_URL}/demand-forecast`, {
        historical_data: historicalData,
        ...params
      });

      const data = response.data.forecast || [];
      setForecastData(data.map((item) => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        predicted_demand: item.predicted_demand,
        lower_bound: item.lower_bound,
        upper_bound: item.upper_bound,
        confidence: item.confidence,
        factors: item.factors
      })));
      
      if (response.data.statistics) {
        setStatistics(response.data.statistics);
      }
      if (response.data.factors_applied) {
        setFactorsApplied(response.data.factors_applied);
      }
      
      console.log('✓ Forecast updated with:', params);
    } catch (error) {
      console.error('Error fetching forecast:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Convert temperature and humidity to integers, keep others as strings
    let newValue = value;
    if (name === 'temperature' || name === 'humidity') {
      newValue = parseInt(value, 10);
    }
    if (name === 'forecast_period') {
      newValue = parseInt(value, 10);
    }
    
    const updatedData = {
      ...formData,
      [name]: newValue
    };
    
    setFormData(updatedData);
    
    console.log('INPUT CHANGED:', name, '=', newValue);
    console.log('FULL FORM DATA BEING SENT:', updatedData);
    
    // Immediate API call with the new data
    const historicalData = generateHistoricalData();
    const requestPayload = {
      historical_data: historicalData,
      forecast_period: updatedData.forecast_period,
      product_type: updatedData.product_type,
      customer_segment: updatedData.customer_segment,
      temperature: updatedData.temperature,
      humidity: updatedData.humidity,
      weather_condition: updatedData.weather_condition
    };
    
    console.log('SENDING TO API:', requestPayload);
    
    axios.post(`${API_BASE_URL}/demand-forecast`, requestPayload)
      .then(response => {
        console.log('API RESPONSE - Statistics:', response.data.statistics);
        console.log('API RESPONSE - Factors Applied:', response.data.factors_applied);
        
        const data = response.data.forecast || [];
        setForecastData(data.map((item) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          predicted_demand: item.predicted_demand,
          lower_bound: item.lower_bound,
          upper_bound: item.upper_bound,
          confidence: item.confidence,
          factors: item.factors
        })));
        
        if (response.data.statistics) {
          setStatistics(response.data.statistics);
        }
        if (response.data.factors_applied) {
          setFactorsApplied(response.data.factors_applied);
        }
      })
      .catch(error => {
        console.error('Error fetching forecast:', error);
      });
  };

  const handlePredict = async () => {
    await fetchForecast();
  };

  const generateHistoricalData = () => {
    // Generate consistent historical data to show factor impact clearly
    const dates = [];
    let baselineDemand = 2500;
    
    for (let i = 90; i > 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // Add trend: gradually increasing
      const trendValue = (90 - i) * 2;
      dates.push({
        date: date.toISOString().split('T')[0],
        demand: baselineDemand + trendValue + (Math.random() * 100 - 50),
        temperature: 25 + Math.random() * 10
      });
    }
    return dates;
  };

  const getProductIcon = (product) => {
    const icons = {
      'luxury': '👑',
      'premium': '⭐',
      'standard': '📦',
      'budget': '💰',
      'seasonal': '📅'
    };
    return icons[product] || '📦';
  };

  const getSegmentIcon = (segment) => {
    const icons = {
      'B2B': '🏢',
      'B2C': '🏪',
      'wholesale': '🏭',
      'retail': '🛍️',
      'enterprise': '🏛️'
    };
    return icons[segment] || '🏢';
  };

  const getWeatherIcon = (weather) => {
    const icons = {
      'clear': '☀️',
      'rainy': '🌧️',
      'cloudy': '☁️',
      'extreme': '⚡',
      'snow': '❄️'
    };
    return icons[weather] || '🌤️';
  };

  const getFactorImpact = () => {
    // Calculate the impact of each factor based on current selections
    const productFactors = {
      'luxury': 1.5, 'premium': 1.25, 'standard': 1.0, 'budget': 0.75, 'seasonal': 1.35
    };
    const segmentFactors = {
      'B2B': 1.4, 'B2C': 1.0, 'wholesale': 1.5, 'retail': 0.8, 'enterprise': 1.6
    };
    const weatherFactors = {
      'clear': 1.0, 'cloudy': 0.95, 'rainy': 0.75, 'snow': 0.65, 'extreme': 0.5
    };
    
    const productImpact = productFactors[formData.product_type] || 1.0;
    const segmentImpact = segmentFactors[formData.customer_segment] || 1.0;
    const weatherImpact = weatherFactors[formData.weather_condition] || 1.0;
    
    let tempImpact = 1.0;
    if (formData.temperature < 0) tempImpact = 0.7;
    else if (formData.temperature < 10) tempImpact = 0.9;
    else if (formData.temperature < 15) tempImpact = 1.0;
    else if (formData.temperature <= 25) tempImpact = 1.15;
    else if (formData.temperature <= 35) tempImpact = 0.95;
    else tempImpact = 0.7;
    
    const humidityDiff = Math.abs(formData.humidity - 50);
    const humidityImpact = 1.0 - (humidityDiff / 100) * 0.3;
    
    const combinedImpact = productImpact * segmentImpact * weatherImpact * tempImpact * humidityImpact;
    
    return {
      productImpact: (productImpact * 100).toFixed(0),
      segmentImpact: (segmentImpact * 100).toFixed(0),
      weatherImpact: (weatherImpact * 100).toFixed(0),
      tempImpact: (tempImpact * 100).toFixed(0),
      humidityImpact: (humidityImpact * 100).toFixed(0),
      combinedImpact: (combinedImpact * 100).toFixed(0)
    };
  };

  return (
    <div className="demand-forecast">
      <div className="forecast-header">
        <h2>📈 Advanced Demand Forecasting & Analytics</h2>
        <button className="download-btn" onClick={() => window.alert('Forecast report will be downloaded')}>
          <Download size={18} />
          Export Report
        </button>
      </div>

      {/* DEBUG SECTION - Shows current form values */}
      <div style={{ backgroundColor: '#0d1b2a', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #00FF00' }}>
        <h4 style={{ marginTop: 0, color: '#00FF00', fontSize: '12px' }}>🔍 DEBUG - Current Parameters Being Used:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', fontSize: '11px' }}>
          <div><span style={{ color: '#AAA' }}>Product:</span> <span style={{ color: '#FF9800', fontWeight: 'bold' }}>{formData.product_type}</span></div>
          <div><span style={{ color: '#AAA' }}>Segment:</span> <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{formData.customer_segment}</span></div>
          <div><span style={{ color: '#AAA' }}>Weather:</span> <span style={{ color: '#2196F3', fontWeight: 'bold' }}>{formData.weather_condition}</span></div>
          <div><span style={{ color: '#AAA' }}>Temp:</span> <span style={{ color: '#FF5722', fontWeight: 'bold' }}>{formData.temperature}°C</span></div>
          <div><span style={{ color: '#AAA' }}>Humidity:</span> <span style={{ color: '#00BCD4', fontWeight: 'bold' }}>{formData.humidity}%</span></div>
          <div><span style={{ color: '#AAA' }}>Period:</span> <span style={{ color: '#9C27B0', fontWeight: 'bold' }}>{formData.forecast_period}d</span></div>
        </div>
      </div>

      {/* COMPREHENSIVE INPUT PARAMETERS */}
      <div style={{ backgroundColor: '#1E2139', padding: '25px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #FF9800' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#FF9800' }}>⚙️ Forecast Configuration</h3>
        
        {/* Main Parameters Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          {/* Period */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '600' }}>📅 Forecast Period (Days)</label>
            <input
              type="number"
              name="forecast_period"
              value={formData.forecast_period}
              onChange={handleInputChange}
              min="5"
              max="365"
              style={{ padding: '10px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          {/* Product Type */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '600' }}>📦 Product Type</label>
            <select
              name="product_type"
              value={formData.product_type}
              onChange={handleInputChange}
              style={{ padding: '10px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', fontSize: '14px' }}
            >
              <option value="luxury">👑 Luxury</option>
              <option value="premium">⭐ Premium</option>
              <option value="standard">📦 Standard</option>
              <option value="budget">💰 Budget</option>
              <option value="seasonal">📅 Seasonal</option>
            </select>
          </div>

          {/* Customer Segment */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '600' }}>🏢 Customer Segment</label>
            <select
              name="customer_segment"
              value={formData.customer_segment}
              onChange={handleInputChange}
              style={{ padding: '10px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', fontSize: '14px' }}
            >
              <option value="B2B">🏢 B2B</option>
              <option value="B2C">🏪 B2C</option>
              <option value="wholesale">🏭 Wholesale</option>
              <option value="retail">🛍️ Retail</option>
              <option value="enterprise">🏛️ Enterprise</option>
            </select>
          </div>
        </div>

        {/* Weather & Environmental Factors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          {/* Temperature */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '600' }}>🌡️ Temperature (°C)</label>
            <input
              type="number"
              name="temperature"
              value={formData.temperature}
              onChange={handleInputChange}
              min="-20"
              max="50"
              style={{ padding: '10px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          {/* Humidity */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '600' }}>💧 Humidity (%)</label>
            <input
              type="number"
              name="humidity"
              value={formData.humidity}
              onChange={handleInputChange}
              min="0"
              max="100"
              style={{ padding: '10px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>

          {/* Weather Condition */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '600' }}>🌤️ Weather Condition</label>
            <select
              name="weather_condition"
              value={formData.weather_condition}
              onChange={handleInputChange}
              style={{ padding: '10px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', fontSize: '14px' }}
            >
              <option value="clear">☀️ Clear</option>
              <option value="cloudy">☁️ Cloudy</option>
              <option value="rainy">🌧️ Rainy</option>
              <option value="snow">❄️ Snow</option>
              <option value="extreme">⚡ Extreme</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handlePredict}
            disabled={isLoading}
            style={{
              padding: '12px 30px',
              backgroundColor: '#FF9800',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '700',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              fontSize: '14px'
            }}
          >
            {isLoading ? '⏳ Forecasting...' : '🔮 Generate Forecast'}
          </button>
        </div>
      </div>

      {/* RESULTS SECTION */}
      {isLoading ? (
        <div className="loading">⏳ Loading forecast with advanced analytics...</div>
      ) : (
        <>
          {/* Summary Cards */}
          {statistics && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ padding: '15px', backgroundColor: '#1E2139', borderRadius: '6px', border: '1px solid #FF9800' }}>
                <div style={{ color: '#AAA', fontSize: '12px', marginBottom: '8px' }}>📊 AVERAGE DEMAND</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>{statistics.avg_demand}</div>
                <div style={{ color: '#666', fontSize: '11px', marginTop: '5px' }}>units/day</div>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#1E2139', borderRadius: '6px', border: '1px solid #4CAF50' }}>
                <div style={{ color: '#AAA', fontSize: '12px', marginBottom: '8px' }}>📈 MAX DEMAND</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{statistics.max_demand}</div>
                <div style={{ color: '#666', fontSize: '11px', marginTop: '5px' }}>peak units</div>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#1E2139', borderRadius: '6px', border: '1px solid #2196F3' }}>
                <div style={{ color: '#AAA', fontSize: '12px', marginBottom: '8px' }}>📉 MIN DEMAND</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>{statistics.min_demand}</div>
                <div style={{ color: '#666', fontSize: '11px', marginTop: '5px' }}>minimum units</div>
              </div>
              <div style={{ padding: '15px', backgroundColor: '#1E2139', borderRadius: '6px', border: '1px solid #9C27B0' }}>
                <div style={{ color: '#AAA', fontSize: '12px', marginBottom: '8px' }}>⏱️ FORECAST PERIOD</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9C27B0' }}>{statistics.period}</div>
                <div style={{ color: '#666', fontSize: '11px', marginTop: '5px' }}>days</div>
              </div>
            </div>
          )}

          {/* Applied Factors Card */}
          {factorsApplied && (
            <div style={{ backgroundColor: '#1E2139', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #2196F3' }}>
              <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#2196F3' }}>🔧 Applied Forecast Factors</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div style={{ padding: '12px', backgroundColor: '#0F1419', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: '#AAA', fontSize: '11px', marginBottom: '5px' }}>Product Type</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FF9800' }}>{getProductIcon(factorsApplied.product)} {factorsApplied.product}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#0F1419', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: '#AAA', fontSize: '11px', marginBottom: '5px' }}>Customer Segment</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>{getSegmentIcon(factorsApplied.customer)} {factorsApplied.customer}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#0F1419', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: '#AAA', fontSize: '11px', marginBottom: '5px' }}>Weather</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2196F3' }}>{getWeatherIcon(factorsApplied.weather)} {factorsApplied.weather}</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#0F1419', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: '#AAA', fontSize: '11px', marginBottom: '5px' }}>Temperature</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FF5722' }}>🌡️ {factorsApplied.temperature}°C</div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#0F1419', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ color: '#AAA', fontSize: '11px', marginBottom: '5px' }}>Humidity</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00BCD4' }}>💧 {factorsApplied.humidity}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Factor Impact Analysis */}
          <div style={{ backgroundColor: '#1E2139', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #FF6F00' }}>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#FF6F00' }}>📊 Factor Impact Analysis</h4>
            <p style={{ color: '#AAA', fontSize: '12px', marginBottom: '15px' }}>
              How each factor modifies the baseline demand (100% = no change)
            </p>
            {(() => {
              const impacts = getFactorImpact();
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '12px', backgroundColor: '#0F1419', borderRadius: '6px' }}>
                    <div style={{ color: '#AAA', fontSize: '11px', marginBottom: '8px' }}>📦 Product Impact</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>{impacts.productImpact}%</div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>Baseline: 100%</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#0F1419', borderRadius: '6px' }}>
                    <div style={{ color: '#AAA', fontSize: '11px', marginBottom: '8px' }}>🏢 Segment Impact</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>{impacts.segmentImpact}%</div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>Baseline: 100%</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#0F1419', borderRadius: '6px' }}>
                    <div style={{ color: '#AAA', fontSize: '11px', marginBottom: '8px' }}>🌤️ Weather Impact</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196F3' }}>{impacts.weatherImpact}%</div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>Baseline: 100%</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#0F1419', borderRadius: '6px' }}>
                    <div style={{ color: '#AAA', fontSize: '11px', marginBottom: '8px' }}>🌡️ Temperature Impact</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF5722' }}>{impacts.tempImpact}%</div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>Baseline: 100%</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#0F1419', borderRadius: '6px' }}>
                    <div style={{ color: '#AAA', fontSize: '11px', marginBottom: '8px' }}>💧 Humidity Impact</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00BCD4' }}>{impacts.humidityImpact}%</div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '5px' }}>Baseline: 100%</div>
                  </div>
                  <div style={{ padding: '12px', backgroundColor: '#FF9800', borderRadius: '6px' }}>
                    <div style={{ color: '#000', fontSize: '11px', marginBottom: '8px', fontWeight: 'bold' }}>🎯 COMBINED IMPACT</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#000' }}>{impacts.combinedImpact}%</div>
                    <div style={{ fontSize: '11px', color: '#333', marginTop: '5px' }}>Total Multiplier</div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Main Forecast Chart */}
          <div className="forecast-chart">
            <h3>📊 {formData.forecast_period}-Day Demand Forecast - {getProductIcon(formData.product_type)} {formData.product_type.charAt(0).toUpperCase() + formData.product_type.slice(1)}</h3>
            {forecastData.length > 0 && (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF9800" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#FF9800" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#222', border: '1px solid #555' }}
                    formatter={(value) => `${value.toLocaleString()} units`}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="predicted_demand" 
                    stroke="#FF9800" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorDemand)" 
                    name="Predicted Demand" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Insights */}
          <div className="forecast-insights">
            <div className="insight-card">
              <h4>📊 Average Daily Demand</h4>
              <div className="insight-value">
                {forecastData.length > 0
                  ? Math.round(forecastData.reduce((sum, item) => sum + item.predicted_demand, 0) / forecastData.length).toLocaleString()
                  : 0} units
              </div>
            </div>
            <div className="insight-card">
              <h4>📈 Peak Demand</h4>
              <div className="insight-value">
                {forecastData.length > 0 ? Math.max(...forecastData.map(d => d.predicted_demand)).toLocaleString() : 0} units
              </div>
            </div>
            <div className="insight-card">
              <h4>📉 Minimum Demand</h4>
              <div className="insight-value">
                {forecastData.length > 0 ? Math.min(...forecastData.map(d => d.predicted_demand)).toLocaleString() : 0} units
              </div>
            </div>
            <div className="insight-card">
              <h4>🎯 Demand Variance</h4>
              <div className="insight-value">
                {forecastData.length > 0 
                  ? (Math.max(...forecastData.map(d => d.predicted_demand)) - Math.min(...forecastData.map(d => d.predicted_demand))).toLocaleString()
                  : 0} units
              </div>
            </div>
          </div>

          {/* Confidence & Bounds */}
          <div style={{ backgroundColor: '#1E2139', padding: '20px', borderRadius: '8px', marginTop: '20px', border: '1px solid #9C27B0' }}>
            <h4 style={{ marginTop: 0, color: '#9C27B0' }}>🎯 Confidence Intervals</h4>
            <p style={{ color: '#AAA', fontSize: '13px', marginBottom: '15px' }}>
              Forecast predictions come with confidence intervals showing the expected range of demand with uncertainty bounds.
            </p>
            {forecastData.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <div style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px' }}>Average Confidence</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9C27B0' }}>
                    {(forecastData.reduce((sum, item) => sum + (item.confidence || 0.85), 0) / forecastData.length * 100).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px' }}>Average Lower Bound</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196F3' }}>
                    {Math.round(forecastData.reduce((sum, item) => sum + item.lower_bound, 0) / forecastData.length).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px' }}>Average Upper Bound</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' }}>
                    {Math.round(forecastData.reduce((sum, item) => sum + item.upper_bound, 0) / forecastData.length).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

