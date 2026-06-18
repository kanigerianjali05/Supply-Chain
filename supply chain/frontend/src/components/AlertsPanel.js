import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import './AlertsPanel.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function AlertsPanel({ alerts, onRefresh }) {
  const [filteredAlerts, setFilteredAlerts] = useState(alerts);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (filter === 'all') {
      setFilteredAlerts(alerts);
    } else {
      setFilteredAlerts(alerts.filter(a => a.severity === filter));
    }
  }, [alerts, filter]);

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="severity-icon high" />;
      case 'medium':
        return <AlertTriangle className="severity-icon medium" />;
      default:
        return <Info className="severity-icon info" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return '#FFA500';
      default:
        return '#2196F3';
    }
  };

  return (
    <div className="alerts-panel">
      <div className="alerts-header">
        <h2>Live Monitoring Alerts</h2>
        <div className="alerts-controls">
          <span className="alert-count">{alerts.length} Active</span>
          <button className="refresh-btn" onClick={onRefresh}>🔄 Refresh</button>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({alerts.length})
        </button>
        <button
          className={`filter-tab ${filter === 'high' ? 'active' : ''}`}
          onClick={() => setFilter('high')}
        >
          High ({alerts.filter(a => a.severity === 'high').length})
        </button>
        <button
          className={`filter-tab ${filter === 'medium' ? 'active' : ''}`}
          onClick={() => setFilter('medium')}
        >
          Medium ({alerts.filter(a => a.severity === 'medium').length})
        </button>
      </div>

      <div className="alerts-list">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className="alert-item" style={{ borderLeftColor: getSeverityColor(alert.severity) }}>
            <div className="alert-icon">
              {getSeverityIcon(alert.severity)}
            </div>
            <div className="alert-content">
              <h3>{alert.title}</h3>
              <p>{alert.description}</p>
              <div className="alert-meta">
                <span className="alert-time">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="alert-change" style={{ color: getSeverityColor(alert.severity) }}>
              {alert.change}
            </div>
          </div>
        ))}
      </div>

      <div className="alerts-footer">
        <button className="action-btn">📥 Export Alerts</button>
        <button className="action-btn">⚙️ Configure Thresholds</button>
      </div>
    </div>
  );
}
