import React, { useState, useEffect } from 'react';
import ExecutiveDashboard from './ExecutiveDashboard';
import DelayRiskMap from './DelayRiskMap';
import AlertsPanel from './AlertsPanel';
import DemandForecast from './DemandForecast';
import ModelPredictions from './ModelPredictions';
import RouteOptimization from './RouteOptimization';
import './Dashboard.css';

export default function Dashboard({ activeTab, dashboardData, alerts, metrics, onDataRefresh }) {
  const [selectedProduct, setSelectedProduct] = useState('Electronics');

  const products = ['Electronics', 'Apparel', 'Furniture', 'Food & Beverage', 'Chemicals', 'Hardware', 'Pharmaceuticals', 'Fragile Items'];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ExecutiveDashboard data={dashboardData} metrics={metrics} alerts={alerts} selectedProduct={selectedProduct} />;
      case 'delay-risk':
        return <DelayRiskMap selectedProduct={selectedProduct} />;
      case 'alerts':
        return <AlertsPanel alerts={alerts} onRefresh={onDataRefresh} selectedProduct={selectedProduct} />;
      case 'demand':
        return <DemandForecast selectedProduct={selectedProduct} />;
      case 'models':
        return <ModelPredictions selectedProduct={selectedProduct} />;
      case 'optimization':
        return <RouteOptimization selectedProduct={selectedProduct} />;
      default:
        return <ExecutiveDashboard data={dashboardData} metrics={metrics} alerts={alerts} selectedProduct={selectedProduct} />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Product Selector at Top */}
      <div style={{ backgroundColor: '#1E2139', padding: '15px 20px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #FF9800', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <label style={{ color: '#FF9800', fontWeight: '700', fontSize: '14px', margin: 0 }}>📦 Global Product Filter:</label>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          style={{
            padding: '10px 15px',
            backgroundColor: '#0F1419',
            color: '#FFF',
            border: '2px solid #FF9800',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            minWidth: '200px'
          }}
        >
          {products.map((product) => (
            <option key={product} value={product}>{product}</option>
          ))}
        </select>
        <span style={{ color: '#AAA', fontSize: '12px', marginLeft: 'auto' }}>✓ All sections updated in real-time</span>
      </div>

      {renderContent()}
    </div>
  );
}
