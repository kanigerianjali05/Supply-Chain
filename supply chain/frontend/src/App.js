import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import { AlertCircle, Cloud, Map, BarChart3, TrendingUp } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overview, alertsData, metricsData] = await Promise.all([
        axios.get(`${API_BASE_URL}/dashboard/overview`),
        axios.get(`${API_BASE_URL}/alerts`),
        axios.get(`${API_BASE_URL}/metrics/key`)
      ]);

      setDashboardData(overview.data);
      setAlerts(alertsData.data.alerts);
      setMetrics(metricsData.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="main-content">
        <header className="header">
          <h1>AI Supply Chain Control Tower</h1>
          <div className="header-right">
            <span className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            <button className="settings-btn">⚙️</button>
          </div>
        </header>

        {loading && dashboardData === null ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <Dashboard 
            activeTab={activeTab}
            dashboardData={dashboardData}
            alerts={alerts}
            metrics={metrics}
            onDataRefresh={fetchDashboardData}
          />
        )}
      </main>
    </div>
  );
}

export default App;
