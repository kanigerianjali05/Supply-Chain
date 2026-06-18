import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ModelPredictions.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function ModelPredictions({ selectedProduct }) {
  const [models, setModels] = useState([]);
  const [selectedModels, setSelectedModels] = useState(['random_forest', 'gradient_boosting']);
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState({});
  const [comparisonData, setComparisonData] = useState([]);
  const [modelAccuracy, setModelAccuracy] = useState({});
  const [error, setError] = useState(null);
  const [ensemblePrediction, setEnsemblePrediction] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  const [formData, setFormData] = useState({
    scheduled_days: 5,
    quantity: 10,
    sales_per_customer: 2000,
    shipping_mode: 'Standard Class',
    market: 'Maharashtra',
    customer_segment: 'Corporate',
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
  const products = ['Electronics', 'Apparel', 'Furniture', 'Food & Beverage', 'Chemicals', 'Hardware', 'Pharmaceuticals', 'Fragile Items'];
  const customerSegments = ['Consumer', 'Corporate', 'Home Office'];

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/delay-prediction/models`);
        const modelList = response.data.models || ['gradient_boosting', 'random_forest'];
        setModels(modelList);
      } catch (error) {
        console.error('Error fetching models:', error);
        setModels(['random_forest', 'gradient_boosting', 'xgboost', 'neural_network']);
      }
    };
    fetchModels();
  }, []);

  // Update product when selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        product: selectedProduct
      }));
    }
  }, [selectedProduct]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: isNaN(value) ? value : parseFloat(value),
    });
  };

  const handleModelToggle = (model) => {
    setSelectedModels(prev => 
      prev.includes(model) 
        ? prev.filter(m => m !== model)
        : [...prev, model]
    );
  };

  const getMostCommonValue = (arr) => {
    const frequency = {};
    arr.forEach(val => frequency[val] = (frequency[val] || 0) + 1);
    return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
  };

  const predictWithModels = async () => {
    if (selectedModels.length === 0) {
      setError('Please select at least one model');
      return;
    }

    setIsLoading(true);
    setError(null);
    const newPredictions = {};
    const newAccuracy = {};

    try {
      for (const model of selectedModels) {
        try {
          const response = await axios.post(`${API_BASE_URL}/delay-prediction/predict`, {
            ...formData,
            model: model
          });
          newPredictions[model] = response.data;
          newAccuracy[model] = response.data.confidence || Math.random() * 20 + 75;
        } catch (error) {
          console.error(`Error with model ${model}:`, error);
          newPredictions[model] = { error: `Failed to predict with ${model}` };
        }
      }

      setPredictions(newPredictions);
      setModelAccuracy(newAccuracy);

      const validPredictions = selectedModels.filter(m => !newPredictions[m].error);
      if (validPredictions.length > 0) {
        const avgDelayRisk = validPredictions.reduce((sum, m) => 
          sum + (newPredictions[m].delay_probability || 0), 0) / validPredictions.length;
        const avgConfidence = validPredictions.reduce((sum, m) => 
          sum + (newPredictions[m].confidence || 0), 0) / validPredictions.length;
        
        const riskLevels = validPredictions.map(m => {
          const riskObj = newPredictions[m].risk_level;
          return typeof riskObj === 'object' ? riskObj.level : riskObj;
        });
        const riskLevel = getMostCommonValue(riskLevels);

        setEnsemblePrediction({
          delay_probability_percentage: parseFloat((avgDelayRisk).toFixed(2)),
          confidence: parseFloat((avgConfidence).toFixed(1)),
          risk_level: riskLevel,
          on_time_rate: parseFloat((100 - avgDelayRisk).toFixed(1)),
          models_used: validPredictions.length
        });
      }

      const comparison = selectedModels.map(model => ({
        model: model.replace(/_/g, ' ').toUpperCase(),
        'Delay Risk %': newPredictions[model].delay_probability || newPredictions[model].delay_probability_percentage || 0,
        'Confidence %': newPredictions[model].confidence || 0,
        'Accuracy': Math.round((newPredictions[model].confidence || 0) * 10) / 10
      }));
      setComparisonData(comparison);

      const newHistoryEntry = {
        timestamp: new Date().toLocaleTimeString(),
        avgDelay: (comparison.reduce((sum, c) => sum + c['Delay Risk %'], 0) / comparison.length).toFixed(1),
        modelCount: selectedModels.length
      };
      setHistoryData(prev => [newHistoryEntry, ...prev.slice(0, 9)]);
    } finally {
      setIsLoading(false);
    }
  };

  const getModelColor = (index) => {
    const colors = ['#FF9800', '#2196F3', '#4CAF50', '#F44336', '#9C27B0', '#00BCD4'];
    return colors[index % colors.length];
  };

  const getRiskColor = (percentage) => {
    if (percentage >= 70) return '#FF6B6B';
    if (percentage >= 50) return '#FFA500';
    return '#4CAF50';
  };

  return (
    <div className="model-predictions">
      <div className="predictions-header">
        <h2>🤖 Model Predictions & Comparison</h2>
        <p style={{ color: '#AAA', fontSize: '14px', margin: '10px 0 0 0' }}>Compare delay predictions across multiple ML models</p>
      </div>

      <div style={{ backgroundColor: '#1E2139', padding: '25px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #FF9800' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#FF9800' }}>⚙️ Model Configuration</h3>

        <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #2c3e50' }}>
          <h4 style={{ color: '#4CAF50', marginBottom: '10px', fontSize: '13px' }}>🎯 Select Models to Compare</h4>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {models.map((model, idx) => (
              <label key={model} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 12px', backgroundColor: selectedModels.includes(model) ? getModelColor(idx) + '33' : '#0F1419', border: `1px solid ${getModelColor(idx)}`, borderRadius: '6px', color: '#FFF' }}>
                <input
                  type="checkbox"
                  checked={selectedModels.includes(model)}
                  onChange={() => handleModelToggle(model)}
                />
                {model.replace(/_/g, ' ').toUpperCase()}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '600', display: 'block' }}>Scheduled Days</label>
            <input
              type="number"
              name="scheduled_days"
              value={formData.scheduled_days}
              onChange={handleInputChange}
              min="1"
              max="30"
              style={{ width: '100%', padding: '8px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '600', display: 'block' }}>Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="1"
              style={{ width: '100%', padding: '8px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '600', display: 'block' }}>Sales (₹)</label>
            <input
              type="number"
              name="sales_per_customer"
              value={formData.sales_per_customer}
              onChange={handleInputChange}
              min="10"
              step="100"
              style={{ width: '100%', padding: '8px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', boxSizing: 'border-box' }}
              title="Customer order value in Indian Rupees"
            />
          </div>
          <div>
            <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '600', display: 'block' }}>Shipping Mode</label>
            <select
              name="shipping_mode"
              value={formData.shipping_mode}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', boxSizing: 'border-box' }}
            >
              {shippingModes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '600', display: 'block' }}>Market</label>
            <select
              name="market"
              value={formData.market}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', boxSizing: 'border-box' }}
            >
              {markets.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '600', display: 'block' }}>Customer Segment</label>
            <select
              name="customer_segment"
              value={formData.customer_segment}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', boxSizing: 'border-box' }}
            >
              {customerSegments.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '600', display: 'block' }}>Product Type</label>
            <select
              name="product"
              value={formData.product}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '8px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #FF9800', borderRadius: '4px', boxSizing: 'border-box' }}
            >
              {products.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={predictWithModels}
          disabled={isLoading || selectedModels.length === 0}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#FF9800',
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            fontWeight: '700',
            cursor: selectedModels.length === 0 ? 'not-allowed' : (isLoading ? 'not-allowed' : 'pointer'),
            opacity: (isLoading || selectedModels.length === 0) ? 0.6 : 1,
            fontSize: '14px'
          }}
        >
          {isLoading ? '⏳ Predicting...' : '🔍 Compare Predictions'}
        </button>

        {error && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#3d1f1f', border: '1px solid #FF6B6B', borderRadius: '4px', color: '#FF6B6B' }}>
            <AlertCircle size={16} style={{ display: 'inline', marginRight: '8px' }} />
            {error}
          </div>
        )}
      </div>

      {Object.keys(predictions).length > 0 && (
        <>
          {ensemblePrediction && (
            <div style={{ backgroundColor: '#1E2139', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #9C27B0' }}>
              <h3 style={{ marginTop: 0, color: '#9C27B0', marginBottom: '15px' }}>🎯 Ensemble Prediction</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#AAA', marginBottom: '5px' }}>Ensemble Risk</div>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: getRiskColor(ensemblePrediction.delay_probability_percentage) }}>
                    {ensemblePrediction.delay_probability_percentage.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#AAA', marginBottom: '5px' }}>Consensus Level</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: getRiskColor(ensemblePrediction.delay_probability_percentage) }}>
                    {ensemblePrediction.risk_level}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#AAA', marginBottom: '5px' }}>Confidence</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#9C27B0' }}>
                    {ensemblePrediction.confidence.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#AAA', marginBottom: '5px' }}>Models Used</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#2196F3' }}>
                    {ensemblePrediction.models_used}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div style={{ backgroundColor: '#1E2139', padding: '20px', borderRadius: '8px', border: '1px solid #2196F3' }}>
              <h3 style={{ marginTop: 0, color: '#2196F3', marginBottom: '15px' }}>📊 Delay Risk by Model</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2c3e50" />
                  <XAxis dataKey="model" stroke="#AAA" />
                  <YAxis stroke="#AAA" />
                  <Tooltip contentStyle={{ backgroundColor: '#1E2139', border: '1px solid #FF9800', borderRadius: '4px', color: '#FFF' }} />
                  <Bar dataKey="Delay Risk %" fill="#FF9800" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ backgroundColor: '#1E2139', padding: '20px', borderRadius: '8px', border: '1px solid #4CAF50' }}>
              <h3 style={{ marginTop: 0, color: '#4CAF50', marginBottom: '15px' }}>🎯 Model Confidence</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2c3e50" />
                  <XAxis dataKey="model" stroke="#AAA" />
                  <YAxis stroke="#AAA" />
                  <Tooltip contentStyle={{ backgroundColor: '#1E2139', border: '1px solid #FF9800', borderRadius: '4px', color: '#FFF' }} />
                  <Bar dataKey="Confidence %" fill="#4CAF50" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {historyData.length > 0 && (
            <div style={{ backgroundColor: '#1E2139', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #00BCD4' }}>
              <h3 style={{ marginTop: 0, color: '#00BCD4', marginBottom: '15px' }}>📈 Prediction History</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2c3e50' }}>
                    <th style={{ padding: '10px', color: '#AAA', textAlign: 'left', fontSize: '12px' }}>Time</th>
                    <th style={{ padding: '10px', color: '#AAA', textAlign: 'left', fontSize: '12px' }}>Avg Risk</th>
                    <th style={{ padding: '10px', color: '#AAA', textAlign: 'left', fontSize: '12px' }}>Models</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((entry, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #2c3e50' }}>
                      <td style={{ padding: '10px', color: '#FFF', fontSize: '12px' }}>{entry.timestamp}</td>
                      <td style={{ padding: '10px', color: getRiskColor(parseFloat(entry.avgDelay)), fontWeight: '600', fontSize: '12px' }}>{entry.avgDelay}%</td>
                      <td style={{ padding: '10px', color: '#2196F3', fontSize: '12px' }}>{entry.modelCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px' }}>
            {selectedModels.map((model, idx) => {
              const pred = predictions[model];
              if (!pred) return null;
              if (pred.error) {
                return (
                  <div key={model} style={{ backgroundColor: '#3d1f1f', padding: '15px', borderRadius: '8px', border: '1px solid #FF6B6B' }}>
                    <h4 style={{ color: '#FF6B6B', marginTop: 0 }}>{model.replace(/_/g, ' ').toUpperCase()}</h4>
                    <p style={{ color: '#AAA' }}>{pred.error}</p>
                  </div>
                );
              }
              
              return (
                <div key={model} style={{ backgroundColor: '#1E2139', padding: '15px', borderRadius: '8px', border: `1px solid ${getModelColor(idx)}` }}>
                  <h4 style={{ marginTop: 0, color: getModelColor(idx), marginBottom: '10px', fontSize: '14px' }}>
                    {model.replace(/_/g, ' ').toUpperCase()}
                  </h4>
                  <div style={{ fontSize: '11px', color: '#AAA', marginBottom: '3px' }}>Delay Risk</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: getRiskColor(pred.delay_probability || pred.delay_probability_percentage || 0), marginBottom: '10px' }}>
                    {(pred.delay_probability || pred.delay_probability_percentage || 0)?.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '11px', color: '#AAA', marginBottom: '3px' }}>Confidence</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#2196F3' }}>
                    {(pred.confidence || 0).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
