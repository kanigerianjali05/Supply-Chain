import React, { useState } from 'react';
import {
  BarChart3,
  Map,
  AlertCircle,
  TrendingUp,
  Brain,
  Zap,
  Menu,
  X,
  Search
} from 'lucide-react';
import './Sidebar.css';

export default function Sidebar({ activeTab, setActiveTab }) {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: BarChart3 },
    { id: 'delay-risk', label: 'Delay Risk Map', icon: Map },
    { id: 'alerts', label: 'Live Alerts', icon: AlertCircle },
    { id: 'demand', label: 'Demand Forecast', icon: TrendingUp },
    { id: 'models', label: 'Model Predictions', icon: Brain },
    { id: 'optimization', label: 'Route Optimization', icon: Zap },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button className="toggle-sidebar" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className="sidebar-header">
        <div className="logo">🚀</div>
        {isOpen && <h2>Supply Chain AI</h2>}
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
            >
              <Icon size={20} />
              {isOpen && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {isOpen && (
          <div className="status-info">
            <div className="status-dot"></div>
            <span>System Live</span>
          </div>
        )}
      </div>
    </aside>
  );
}
