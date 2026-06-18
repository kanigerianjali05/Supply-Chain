# AI Supply Chain Control Tower

A comprehensive AI-powered supply chain management system with real-time monitoring, ML-based analytics, demand forecasting, and route optimization.

## Features

### 📊 Executive Dashboard
- Real-time KPI metrics (Delay Risk, On-Time Delivery, Supply Chain Efficiency, Forecast Accuracy)
- Demand predictions (30-day forecast)
- Delay risk distribution analysis
- Top risk routes monitoring

### 📍 Delay Risk Map
- Interactive geographical route visualization
- Risk probability calculations
- Real-time status tracking
- Route delay insights

### 🚨 Live Monitoring Alerts
- Real-time alert system with severity levels
- Weather, traffic, and operational incident tracking
- Customizable alert thresholds
- Alert filtering and management

### 📈 Demand Forecasting
- ML-based demand prediction (30 days)
- Confidence intervals and bounds
- Seasonal pattern analysis
- Model accuracy tracking (91% accuracy)

### 👥 Supplier Intelligence
- Supplier risk analysis and scoring
- Multi-factor risk assessment
- Performance metrics (on-time rate, quality, defect rate)
- Risk mitigation recommendations

### 🚗 Route Optimization
- AI-powered route recommendations
- Cost and time savings calculations
- Traffic and weather impact analysis
- Alternative route suggestions

## Tech Stack

### Backend
- **Framework**: Flask (Python)
- **ML/DL Libraries**: scikit-learn, TensorFlow, Keras
- **Data Processing**: Pandas, NumPy
- **Visualization**: Plotly, Folium

### Frontend
- **Framework**: React 18
- **Charts**: Recharts, Chart.js
- **Maps**: Leaflet, Folium
- **UI Icons**: Lucide React
- **HTTP Client**: Axios

### Data
- **Format**: CSV, JSON
- **Upload Support**: File-based data ingestion
- **Historical Data**: 90+ days of supply chain metrics

## Project Structure

```
supply-chain/
├── backend/
│   ├── app.py                 # Flask API server
│   ├── requirements.txt        # Python dependencies
│   └── models/
│       ├── demand_forecast.py # Demand prediction model
│       ├── risk_analyzer.py    # Supplier risk analysis
│       └── delay_predictor.py  # Route delay prediction
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main application
│   │   ├── index.js          # React entry point
│   │   └── components/
│   │       ├── Dashboard.js
│   │       ├── ExecutiveDashboard.js
│   │       ├── AlertsPanel.js
│   │       ├── DelayRiskMap.js
│   │       ├── DemandForecast.js
│   │       ├── SupplierIntelligence.js
│   │       ├── RouteOptimization.js
│   │       └── Sidebar.js
│   ├── public/
│   │   └── index.html
│   └── package.json
├── data/                      # Sample data files
├── models/                    # Trained ML models
└── README.md
```

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm or yarn

### Backend Setup

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Start Flask server
python app.py
```
Server runs on `http://localhost:5000`

### Frontend Setup

```bash
# Install Node dependencies
cd frontend
npm install

# Start React development server
npm start
```
Frontend runs on `http://localhost:3000`

## API Endpoints

### Dashboard
- `GET /api/dashboard/overview` - Get overview metrics
- `GET /api/alerts` - Get live monitoring alerts
- `GET /api/metrics/key` - Get key performance indicators

### Forecasting & Analysis
- `POST /api/demand-forecast` - Get demand predictions
- `POST /api/supplier-risk` - Analyze supplier risks
- `POST /api/delay-prediction` - Predict route delays
- `GET /api/routes-map` - Get route geolocation data

### Data Management
- `POST /api/upload-data` - Upload CSV/JSON data
- `GET /api/health` - API health check

## Usage

### Upload Data
1. Prepare CSV/JSON files with:
   - Historical demand data
   - Supplier performance metrics
   - Route information
   - Weather/traffic data

2. Use the upload endpoint:
   ```bash
   curl -X POST -F "file=@data.csv" -F "type=historical" \
     http://localhost:5000/api/upload-data
   ```

### Dashboard Navigation
- **Executive Dashboard**: Overview of all metrics and KPIs
- **Delay Risk Map**: View routes with delay probabilities
- **Live Alerts**: Monitor real-time supply chain alerts
- **Demand Forecast**: View demand predictions and trends
- **Supplier Intelligence**: Analyze supplier performance and risks
- **Route Optimization**: Get optimization recommendations

## ML Models

### Demand Forecasting
- Algorithm: Random Forest Regressor
- Features: Historical demand, temperature, seasonality, day patterns
- Accuracy: ~91%
- Prediction Window: 30 days

### Supplier Risk Analysis
- Algorithm: Multi-factor weighted scoring
- Factors: On-time reliability, quality compliance, cost index, defect rate
- Output: Risk scores (0-100%) and mitigation recommendations

### Delay Prediction
- Algorithm: Gradient Boosting Classifier
- Features: Weather conditions, traffic density, historical delays
- Output: Delay probability and risk categories

## Customization

### Update API Base URL
Edit `frontend/src/App.js`:
```javascript
const API_BASE_URL = 'http://your-backend-url:5000/api';
```

### Modify Risk Thresholds
Edit `backend/models/risk_analyzer.py`:
```python
self.risk_thresholds = {
    'high': 0.7,
    'medium': 0.4,
    'low': 0.0
}
```

### Add New Metrics
1. Create new endpoint in `backend/app.py`
2. Add React component in `frontend/src/components/`
3. Update dashboard layout

## Performance Optimization

- Realtime data refresh: 30 seconds
- Frontend chart optimization: Recharts lazy loading
- Backend caching: Flask response caching
- Database queries: Indexed historical data

## Troubleshooting

### Port Already in Use
```bash
# Change backend port
# In app.py: app.run(..., port=5001)

# Change frontend port
# In package.json: "start": "PORT=3001 react-scripts start"
```

### CORS Issues
Ensure Flask-CORS is enabled in `backend/app.py`:
```python
CORS(app)
```

### Data Not Loading
Check:
1. Backend API is running on port 5000
2. Sample data files exist in `/data` directory
3. Check browser console for API errors

## Future Enhancements

- 🔐 User authentication and role-based access
- 📊 Advanced analytics and custom reports
- 🤖 Deep learning models for complex predictions
- 🔔 Email/SMS alert notifications
- 📱 Mobile app version
- 🌐 Multi-language support
- 🔄 Real-time data streaming via WebSocket

## License

MIT License - Feel free to use this project for personal or commercial purposes.

## Support

For issues and feature requests, please create an issue in the repository.

---

**Version**: 1.0.0  
**Last Updated**: 2024
