import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RoutePreview, RouteAlt1 } from 'lucide-react';
import './RouteOptimization.css';

const API_BASE_URL = 'http://localhost:5000/api';

export default function RouteOptimization() {
  const [routesData, setRoutesData] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    origin: 'Mumbai',
    destination: 'Bengaluru',
    distance: 350,
    weather: 'Clear',
    shipment_type: 'Standard',
    urgency: 'Normal',
    product: 'Electronics'
  });

  useEffect(() => {
    fetchRouteData();
  }, []);

  const fetchRouteData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/routes-map`);
      setRoutesData(response.data.routes || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: isNaN(value) ? value : parseFloat(value)
    });
  };

  const handleOptimizeRoute = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/delay-prediction`, {
        route_data: [{
          name: `${formData.origin} → ${formData.destination}`,
          distance: formData.distance,
          weather: formData.weather,
          shipment_type: formData.shipment_type,
          urgency: formData.urgency
        }]
      });
      // Add optimized route to beginning of list
      if (response.data && response.data.routes) {
        setRoutesData([response.data.routes[0], ...routesData]);
      }
    } catch (error) {
      console.error('Error optimizing route:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateSavings = (route) => {
    const timeDiff = route.estimated_time - route.actual_time;
    const distanceSavings = Math.random() * 100;
    const costSavings = Math.random() * 500;
    return { timeDiff, distanceSavings, costSavings };
  };

  const calculateMetrics = () => {
    if (routesData.length === 0) {
      return {
        avgDelay: 0,
        monthlySavings: 0,
        totalDistance: 0,
        avgDelayHours: '0h',
        savingsBreakdown: { fuel: 0, time: 0, penalty: 0 }
      };
    }

    // Calculate average delay from routes
    const totalDelay = routesData.reduce((sum, route) => {
      const timeDiff = (route.estimated_time || 0) - (route.actual_time || 0);
      return sum + Math.max(0, timeDiff);
    }, 0);
    const avgDelayMinutes = routesData.length > 0 ? totalDelay / routesData.length : 0;
    const avgDelayHours = (avgDelayMinutes / 60).toFixed(1);

    // Calculate total distance
    const totalDistance = routesData.reduce((sum, route) => sum + (route.distance || 0), 0);

    // Calculate realistic monthly savings from multiple factors
    let fuelSavings = 0;
    let timeSavings = 0;
    let penaltySavings = 0;

    routesData.forEach((route) => {
      const distance = route.distance || 100;
      const estimatedTime = route.estimated_time || (distance / 60);
      const actualTime = route.actual_time || (distance / 70);
      const timeSaved = Math.max(0, estimatedTime - actualTime);

      // Fuel savings: ₹15 per km saved (assuming 10% optimization)
      fuelSavings += (distance * 0.1) * 15;

      // Time savings: ₹20 per hour (labor cost)
      timeSavings += timeSaved * 20;

      // Delay penalty avoidance: ₹500 per hour of delay prevented
      const delayHours = Math.max(0, (route.estimated_time || 0) - (route.actual_time || 0)) / 60;
      penaltySavings += delayHours * 500;
    });

    // Monthly projection (assuming ~20 shipments per route per month on average)
    const monthlyMultiplier = 20;
    const totalMonthlySavings = Math.round((fuelSavings + timeSavings + penaltySavings) * monthlyMultiplier / 100);

    return {
      avgDelay: totalDelay,
      monthlySavings: totalMonthlySavings,
      totalDistance: totalDistance,
      avgDelayHours: avgDelayHours > 0 ? `${avgDelayHours}h` : '< 1h',
      savingsBreakdown: {
        fuel: Math.round(fuelSavings * monthlyMultiplier / 100),
        time: Math.round(timeSavings * monthlyMultiplier / 100),
        penalty: Math.round(penaltySavings * monthlyMultiplier / 100)
      }
    };
  };

  const metrics = calculateMetrics();

  const generateRecommendations = (route) => {
    const recommendations = [];
    const distance = route.distance || 100;
    const estimatedTime = route.estimated_time || (distance / 60);
    const actualTime = route.actual_time || (distance / 70);
    const delay = estimatedTime - actualTime;

    // Time-based recommendations
    if (Math.abs(delay) > 2) {
      recommendations.push(`✓ High delay detected (${Math.abs(delay).toFixed(1)}h) - Schedule early morning departure (5-6 AM)`);
    } else if (Math.abs(delay) > 1) {
      recommendations.push(`✓ Moderate delay (${Math.abs(delay).toFixed(1)}h) - Avoid peak hours (8-10 AM, 6-8 PM)`);
    } else {
      recommendations.push(`✓ Route performing well - Maintain current schedule`);
    }

    // Distance-based recommendations
    if (distance > 500) {
      recommendations.push(`✓ Long-distance route (${distance}km) - Consider overnight delivery with rest stops`);
    } else if (distance > 300) {
      recommendations.push(`✓ Medium-distance route (${distance}km) - Optimize fuel with highway routes`);
    } else {
      recommendations.push(`✓ Short-distance route (${distance}km) - Use urban-optimized paths`);
    }

    // Savings opportunities
    const potentialSavings = Math.max(0, delay) * 500;
    if (potentialSavings > 500) {
      recommendations.push(`✓ High savings potential ₹${potentialSavings.toFixed(0)} - Implement GPS-guided routing`);
    } else {
      recommendations.push(`✓ Consider real-time traffic monitoring - Save ₹${Math.min(500, distance * 5)}`);
    }

    // Route-specific optimization
    if (route.shipment_type === 'Fragile' || route.shipment_type === 'Temperature-Controlled') {
      recommendations.push(`✓ Sensitive cargo detected - Use buffer routes for safety`);
    } else if (distance > 800) {
      recommendations.push(`✓ Consolidate with similar routes for fuel efficiency`);
    } else {
      recommendations.push(`✓ Enable predictive arrival notifications`);
    }

    // General efficiency
    recommendations.push(`✓ Leverage real-time tracking for accurate ETAs`);

    return recommendations;
  };

  const origins = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai'];
  const destinations = ['Bengaluru', 'Hyderabad', 'Mumbai', 'Delhi', 'Chennai'];
  const weatherConditions = ['Clear', 'Cloudy', 'Rainy', 'Stormy', 'Fog'];
  const shipmentTypes = ['Standard', 'Fragile', 'Temperature-Controlled', 'Hazmat'];
  const urgencies = ['Normal', 'High', 'Critical'];
  const products = ['Electronics', 'Apparel', 'Furniture', 'Food & Beverage', 'Chemicals', 'Hardware', 'Pharmaceuticals', 'Fragile Items'];

  return (
    <div className="route-optimization">
      <div className="optimization-header">
        <h2>🛣️ Route Optimization & Recommendations</h2>
        <p>AI-powered route planning to reduce delays and optimize costs</p>
      </div>

      {/* INPUT PARAMETERS WITH INTEGRATED RESULTS */}
      <div style={{ backgroundColor: '#1E2139', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #4CAF50' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#4CAF50' }}>⚙️ Route Parameters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: routesData.length > 0 ? '1fr 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* INPUT SECTION */}
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '500' }}>Origin City</label>
                <select
                  name="origin"
                  value={formData.origin}
                  onChange={handleInputChange}
                  style={{ padding: '8px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #4CAF50', borderRadius: '4px' }}
                >
                  {origins.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '500' }}>Destination City</label>
                <select
                  name="destination"
                  value={formData.destination}
                  onChange={handleInputChange}
                  style={{ padding: '8px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #4CAF50', borderRadius: '4px' }}
                >
                  {destinations.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gridColumn: '1 / -1' }}>
                <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '500' }}>Distance (km)</label>
                <input
                  type="number"
                  name="distance"
                  value={formData.distance}
                  onChange={handleInputChange}
                  min="50"
                  max="1000"
                  style={{ padding: '8px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #4CAF50', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '500' }}>Weather</label>
                <select
                  name="weather"
                  value={formData.weather}
                  onChange={handleInputChange}
                  style={{ padding: '8px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #4CAF50', borderRadius: '4px' }}
                >
                  {weatherConditions.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '500' }}>Shipment Type</label>
                <select
                  name="shipment_type"
                  value={formData.shipment_type}
                  onChange={handleInputChange}
                  style={{ padding: '8px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #4CAF50', borderRadius: '4px' }}
                >
                  {shipmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '500' }}>Urgency</label>
                <select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleInputChange}
                  style={{ padding: '8px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #4CAF50', borderRadius: '4px' }}
                >
                  {urgencies.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ color: '#AAA', fontSize: '12px', marginBottom: '5px', fontWeight: '500' }}>Product Type</label>
                <select
                  name="product"
                  value={formData.product}
                  onChange={handleInputChange}
                  style={{ padding: '8px', backgroundColor: '#0F1419', color: '#FFF', border: '1px solid #4CAF50', borderRadius: '4px' }}
                >
                  {products.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button
                onClick={handleOptimizeRoute}
                disabled={isLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: '#000',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  height: 'fit-content',
                  gridColumn: '1 / -1'
                }}
              >
                {isLoading ? '⏳ Optimizing...' : '📍 Optimize Route'}
              </button>
            </div>
          </div>

          {/* RESULTS SUMMARY (INLINE) */}
          {routesData.length > 0 && routesData[0] && (
            <div style={{ padding: '15px', backgroundColor: '#0F1419', borderRadius: '6px', border: '2px solid #4CAF50', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ textAlign: 'center', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
                <div style={{ fontSize: '12px', color: '#AAA', marginBottom: '5px' }}>ROUTE OPTIMIZATION</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4CAF50', marginBottom: '3px' }}>
                  {formData.origin} → {formData.destination}
                </div>
                <div style={{ fontSize: '12px', color: '#AAA' }}>{formData.distance} km</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div style={{ padding: '8px', backgroundColor: '#1E2139', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ color: '#AAA', fontSize: '11px' }}>Est. Time</div>
                  <div style={{ color: '#4CAF50', fontWeight: 'bold', marginTop: '3px' }}>
                    {(formData.distance / 60).toFixed(1)}h
                  </div>
                </div>
                <div style={{ padding: '8px', backgroundColor: '#1E2139', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ color: '#AAA', fontSize: '11px' }}>Weather Impact</div>
                  <div style={{ color: formData.weather === 'Clear' ? '#4CAF50' : '#FFA500', fontWeight: 'bold', marginTop: '3px' }}>
                    {formData.weather}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div style={{ padding: '8px', backgroundColor: '#1E2139', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ color: '#AAA', fontSize: '11px' }}>Shipment Type</div>
                  <div style={{ color: '#2196F3', fontWeight: 'bold', marginTop: '3px' }}>
                    {formData.shipment_type}
                  </div>
                </div>
                <div style={{ padding: '8px', backgroundColor: '#1E2139', borderRadius: '4px', textAlign: 'center' }}>
                  <div style={{ color: '#AAA', fontSize: '11px' }}>Urgency Level</div>
                  <div style={{ color: formData.urgency === 'Critical' ? '#FF6B6B' : formData.urgency === 'High' ? '#FFA500' : '#4CAF50', fontWeight: 'bold', marginTop: '3px' }}>
                    {formData.urgency}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="optimization-metrics">
        <div className="metric-card">
          <div className="metric-icon">🚚</div>
          <div className="metric-info">
            <div className="metric-value">{routesData.length}</div>
            <div className="metric-label">Active Routes</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">⏱️</div>
          <div className="metric-info">
            <div className="metric-value">{routesData.length === 0 ? '—' : metrics.avgDelayHours}</div>
            <div className="metric-label">Avg Delay</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-info">
            <div className="metric-value">{routesData.length === 0 ? '—' : `₹${metrics.monthlySavings}K`}</div>
            <div className="metric-label">Monthly Savings Potential</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📍</div>
          <div className="metric-info">
            <div className="metric-value">{routesData.length === 0 ? '—' : `${metrics.totalDistance} km`}</div>
            <div className="metric-label">Distance Optimization</div>
          </div>
        </div>
      </div>

      {routesData.length > 0 && (
        <div style={{ backgroundColor: '#1E2139', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #FF9800' }}>
          <h3 style={{ marginTop: 0, color: '#FF9800', marginBottom: '15px' }}>💡 Savings Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{ padding: '15px', backgroundColor: '#0F1419', borderRadius: '6px', border: '1px solid #4CAF50' }}>
              <div style={{ fontSize: '11px', color: '#AAA', marginBottom: '5px' }}>⛽ Fuel Savings</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#4CAF50' }}>₹{metrics.savingsBreakdown.fuel}K</div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '5px' }}>10% distance optimization</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#0F1419', borderRadius: '6px', border: '1px solid #2196F3' }}>
              <div style={{ fontSize: '11px', color: '#AAA', marginBottom: '5px' }}>⏱️ Time Savings</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#2196F3' }}>₹{metrics.savingsBreakdown.time}K</div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '5px' }}>Labor cost reduction</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#0F1419', borderRadius: '6px', border: '1px solid #9C27B0' }}>
              <div style={{ fontSize: '11px', color: '#AAA', marginBottom: '5px' }}>🎉 Delay Avoidance</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#9C27B0' }}>₹{metrics.savingsBreakdown.penalty}K</div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '5px' }}>Penalty reduction</div>
            </div>
          </div>
          <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#2c3e50', borderLeft: '4px solid #FF9800', borderRadius: '4px' }}>
            <div style={{ fontSize: '12px', color: '#AAA' }}>💰 <strong>Total Monthly Impact:</strong> ₹{metrics.monthlySavings}K (projected on ~20 shipments/route/month)</div>
          </div>
        </div>
      )}

      <div className="routes-recommendations">
        <h3>Route Optimization Suggestions</h3>
        <div className="recommendations-grid">
          {routesData.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#AAA' }}>
              <p style={{ fontSize: '16px', marginBottom: '10px' }}>🛣️ No routes optimized yet</p>
              <p style={{ fontSize: '13px' }}>Click "📍 Optimize Route" above to see optimization suggestions</p>
            </div>
          ) : (
            routesData.map((route) => {
              const savings = calculateSavings(route);
              const actualTime = route.actual_time || (route.distance / 60).toFixed(1);
              return (
                <div
                  key={route.id}
                  className="recommendation-card"
                  onClick={() => setSelectedRoute(selectedRoute?.id === route.id ? null : route)}
                >
                  <div className="route-info">
                    <div className="route-title">{route.name}</div>
                    <div className="route-distance">{route.distance} km</div>
                  </div>

                  <div className="optimization-data">
                    <div className="data-item">
                      <span className="data-label">Current Time</span>
                      <span className="data-value">{actualTime}h</span>
                    </div>
                    <div className="data-item">
                      <span className="data-label">Potential Savings</span>
                      <span className="data-value gain">-{Math.abs(savings.timeDiff || 0).toFixed(1)}h</span>
                    </div>
                  </div>

                  {selectedRoute?.id === route.id && (
                    <div className="route-suggestions">
                      <h4>Optimization Recommendations</h4>
                      <ul>
                        {generateRecommendations(route).map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                      <div className="suggestion-details">
                        <div className="detail-item">
                          <span>Estimated Cost Savings:</span>
                          <strong>₹{(savings.costSavings || 0).toFixed(0)}</strong>
                        </div>
                        <div className="detail-item">
                          <span>Distance Optimization:</span>
                          <strong>{(savings.distanceSavings || 0).toFixed(0)} km</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="optimization-actions">
        <button className="action-button primary">🚀 Apply All Optimizations</button>
        <button className="action-button secondary">📊 Generate Report</button>
        <button className="action-button secondary">⚙️ Configure Settings</button>
      </div>
    </div>
  );
}
