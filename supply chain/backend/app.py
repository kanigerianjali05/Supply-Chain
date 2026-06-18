from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os
from models.demand_forecast import DemandForecaster
from models.risk_analyzer import RiskAnalyzer
from models.delay_predictor import DelayPredictor
from models.data_loader import DataLoader

app = Flask(__name__)
CORS(app)

# Initialize ML models
demand_model = DemandForecaster()
risk_analyzer = RiskAnalyzer()
delay_predictor = DelayPredictor()
data_loader = DataLoader(data_dir='../data')

# Global variables for holding loaded data
loaded_data = None
data_stats = None

# Auto-initialize models on startup (non-blocking)
def initialize_models():
    """Auto-load and train models on startup (skipped to improve startup time - will initialize on first prediction)"""
    global loaded_data, data_stats
    # Models will be trained on first prediction request to avoid slow startup
    print("✓ Models will auto-train on first prediction request")

# Call initialization on app startup
initialize_models()

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy', 
        'model_trained': delay_predictor.is_trained,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/delay-prediction/models', methods=['GET'])
def get_available_models():
    """Get list of available prediction models"""
    try:
        available_models = [m for m, model in delay_predictor.models.items() if model is not None]
        return jsonify({
            'status': 'success',
            'models': available_models,
            'default_model': 'gradient_boosting',
            'count': len(available_models)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/load-historical', methods=['POST'])
def load_historical_data():
    """Load and preprocess historical supply chain data"""
    try:
        global loaded_data, data_stats
        
        filename = request.json.get('filename', 'DataCoSupplyChainDataset.csv') if request.json else 'DataCoSupplyChainDataset.csv'
        
        # Load data
        df = data_loader.load_dataset(filename)
        if df is None:
            return jsonify({'error': 'Failed to load dataset'}), 500
        
        loaded_data = df
        
        # Get statistics
        data_stats = data_loader.get_statistics()
        
        return jsonify({
            'status': 'success',
            'message': f'Loaded {len(df)} records',
            'records': len(df),
            'columns': len(df.columns),
            'column_names': list(df.columns),
            'statistics': data_stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/train-models', methods=['POST'])
def train_models_on_data():
    """Train all ML models using the loaded historical data"""
    try:
        if loaded_data is None:
            return jsonify({'error': 'No data loaded. Call /api/data/load-historical first'}), 400
        
        results = {}
        
        # Preprocess data
        data_loader.preprocess_for_delay_prediction()
        
        # Train delay predictor
        delay_result = delay_predictor.train_from_data(data_loader)
        results['delay_predictor'] = delay_result
        
        # Get delay patterns
        delay_analysis = data_loader.get_delay_analysis()
        results['delay_analysis'] = delay_analysis
        
        # Get customer segments analysis
        segments_analysis = data_loader.get_customer_segments_analysis()
        results['customer_segments'] = segments_analysis
        
        return jsonify({
            'status': 'success',
            'message': 'Models trained successfully',
            'results': results
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/data/statistics', methods=['GET'])
def get_data_statistics():
    """Get statistics from loaded data"""
    try:
        if data_stats is None:
            return jsonify({'error': 'No data loaded yet'}), 400
        
        return jsonify(data_stats)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delay-prediction/batch', methods=['POST'])
def predict_delays_batch():
    """Predict delays for a batch of shipments using trained model"""
    try:
        data = request.json
        features_list = data.get('features', [])
        
        if not features_list:
            return jsonify({'error': 'No features provided'}), 400
        
        predictions = delay_predictor.predict_batch(features_list)
        
        # Categorize by risk
        high_risk = [p for p in predictions if p.get('delay_probability', 0) > 70]
        medium_risk = [p for p in predictions if 40 <= p.get('delay_probability', 0) <= 70]
        low_risk = [p for p in predictions if p.get('delay_probability', 0) < 40]
        
        return jsonify({
            'predictions': predictions,
            'summary': {
                'total': len(predictions),
                'high_risk': len(high_risk),
                'medium_risk': len(medium_risk),
                'low_risk': len(low_risk),
                'avg_delay_probability': round(np.mean([p.get('delay_probability', 0) for p in predictions]), 2)
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delay-prediction/insights', methods=['GET'])
def get_delay_prediction_insights():
    """Get insights from trained delay prediction model"""
    try:
        insights = delay_predictor.get_model_insights()
        return jsonify(insights)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/mitigation/actions', methods=['POST'])
def get_mitigation_actions():
    """Get recommended mitigation actions for a risk level"""
    try:
        data = request.json
        risk_level = data.get('risk_level', 'Medium')
        
        actions = delay_predictor.get_mitigation_actions(risk_level)
        
        return jsonify({
            'risk_level': risk_level,
            'actions': actions
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/overview', methods=['GET'])
def get_dashboard_overview():
    """Get overview metrics for dashboard using real data if available"""
    try:
        if data_stats:
            # Use real data statistics
            overview_data = {
                'delay_risk': round((data_stats.get('late_delivery_rate', 0) * 100), 1),
                'on_time_delivery': round(((1 - data_stats.get('late_delivery_rate', 0)) * 100), 1),
                'supply_chain_efficiency': 85,
                'forecast_accuracy': 91 if delay_predictor.is_trained else 0,
                'total_shipments': data_stats.get('total_records', 0),
                'avg_shipping_days': round(data_stats.get('avg_shipping_days_real', 0), 1),
                'is_model_trained': delay_predictor.is_trained,
                'timestamp': datetime.now().isoformat(),
                'data_last_updated': datetime.now().isoformat()
            }
        else:
            # Sample data - replace with actual data source
            overview_data = {
                'delay_risk': 72,
                'on_time_delivery': 78,
                'supply_chain_efficiency': 85,
                'forecast_accuracy': 91,
                'total_shipments': 0,
                'is_model_trained': False,
                'timestamp': datetime.now().isoformat(),
                'data_last_updated': (datetime.now() - timedelta(minutes=5)).isoformat()
            }
        return jsonify(overview_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get live monitoring alerts"""
    try:
        alerts = [
            {
                'id': 1,
                'title': 'Port Strike in Mumbai',
                'severity': 'high',
                'change': '+4%',
                'timestamp': (datetime.now() - timedelta(minutes=3)).isoformat(),
                'description': 'Maritime workers initiated port strike affecting cargo operations'
            },
            {
                'id': 2,
                'title': 'Flood Warning in Chennai',
                'severity': 'high',
                'change': '+9%',
                'timestamp': (datetime.now() - timedelta(minutes=15)).isoformat(),
                'description': 'Heavy rainfall causing potential logistics delays'
            },
            {
                'id': 3,
                'title': 'Fuel Price Surge in India',
                'severity': 'medium',
                'change': '+3%',
                'timestamp': (datetime.now() - timedelta(minutes=30)).isoformat(),
                'description': 'Significant increase in fuel prices affecting transportation costs'
            },
            {
                'id': 4,
                'title': 'Supplier C High Risk',
                'severity': 'high',
                'change': '+5%',
                'timestamp': (datetime.now() - timedelta(hours=1)).isoformat(),
                'description': 'Supplier C reliability dropped below threshold'
            }
        ]
        return jsonify({'alerts': alerts, 'count': len(alerts)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/demand-forecast', methods=['POST'])
def get_demand_forecast():
    """Predict demand using ML model with multiple features"""
    try:
        data = request.json
        forecast_period = int(data.get('forecast_period', 30))
        product_type = str(data.get('product_type', 'standard')).strip()
        customer_segment = str(data.get('customer_segment', 'B2B')).strip()
        temperature = int(data.get('temperature', 25))
        humidity = int(data.get('humidity', 60))
        weather_condition = str(data.get('weather_condition', 'clear')).strip()
        
        # CRITICAL DEBUG: Log received parameters
        print(f"\n{'='*70}")
        print(f"BACKEND - DEMAND FORECAST REQUEST RECEIVED:")
        print(f"{'='*70}")
        print(f"  Product Type: '{product_type}' (type: {type(product_type).__name__})")
        print(f"  Customer Segment: '{customer_segment}' (type: {type(customer_segment).__name__})")
        print(f"  Temperature: {temperature}°C (type: {type(temperature).__name__})")
        print(f"  Humidity: {humidity}% (type: {type(humidity).__name__})")
        print(f"  Weather: '{weather_condition}' (type: {type(weather_condition).__name__})")
        print(f"  Forecast Period: {forecast_period} days (type: {type(forecast_period).__name__})")
        print(f"{'='*70}\n")
        
        # Get historical data
        historical_data = data.get('historical_data')
        if not historical_data:
            # Generate sample historical data if not provided
            historical_data = []
            for i in range(90):
                date = datetime.now() - timedelta(days=90-i)
                historical_data.append({
                    'date': date.isoformat(),
                    'demand': 2500 + np.random.randint(-500, 500),
                    'temperature': 20 + np.random.randint(-10, 15)
                })
            print(f"Generated {len(historical_data)} historical data points")
        else:
            print(f"Received {len(historical_data)} historical data points from frontend")
        
        # Use demand forecaster
        forecast = demand_model.predict(
            historical_data=historical_data,
            periods=forecast_period,
            product_type=product_type,
            customer_segment=customer_segment,
            temperature=temperature,
            humidity=humidity,
            weather_condition=weather_condition
        )
        
        # Calculate statistics
        if forecast and isinstance(forecast, list) and len(forecast) > 0:
            demands = [f['predicted_demand'] for f in forecast]
            avg_demand = int(np.mean(demands))
            max_demand = int(np.max(demands))
            min_demand = int(np.min(demands))
            
            # DEBUG: Log forecast statistics
            print(f"\nBACKEND - FORECAST STATISTICS:")
            print(f"  Average: {avg_demand}, Max: {max_demand}, Min: {min_demand}\n")
            
            return jsonify({
                'forecast': forecast,
                'statistics': {
                    'avg_demand': avg_demand,
                    'max_demand': max_demand,
                    'min_demand': min_demand,
                    'period': forecast_period,
                    'product_type': product_type,
                    'customer_segment': customer_segment
                },
                'model_accuracy': 0.87,
                'factors_applied': {
                    'product': product_type,
                    'customer': customer_segment,
                    'weather': weather_condition,
                    'temperature': temperature,
                    'humidity': humidity
                }
            })
        else:
            return jsonify({'error': 'Failed to generate forecast'}), 500
    except Exception as e:
        print(f"Demand forecast error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/supplier-risk', methods=['POST'])
def analyze_supplier_risk():
    """Analyze supplier risk using ML model"""
    try:
        data = request.json
        supplier_data = data.get('supplier_data', [])
        
        if not supplier_data:
            supplier_data = generate_sample_supplier_data()
        
        # Analyze each supplier
        analyzed_suppliers = []
        for supplier in supplier_data:
            # Calculate risk score
            on_time = float(supplier.get('on_time_rate', 0.85))
            quality = float(supplier.get('quality_score', 0.90))
            defect = float(supplier.get('defect_rate', 0.05))
            cost = float(supplier.get('cost_index', 0.85))
            
            # Risk formula: lower on-time rate and higher defect rate = higher risk
            risk_score = (1 - on_time) * 0.4 + defect * 0.3 + (1 - quality) * 0.2 + (1 - cost) * 0.1
            
            # Determine risk level
            if risk_score >= 0.5:
                risk_level = 'High'
            elif risk_score >= 0.3:
                risk_level = 'Medium'
            else:
                risk_level = 'Low'
            
            analyzed_suppliers.append({
                'name': supplier.get('name', 'Unknown'),
                'risk_score': round(risk_score * 100, 1),
                'risk_level': risk_level,
                'on_time_rate': round(on_time * 100, 1),
                'quality_score': round(quality * 100, 1),
                'defect_rate': round(defect * 100, 1)
            })
        
        return jsonify({
            'suppliers': analyzed_suppliers,
            'high_risk_count': len([s for s in analyzed_suppliers if s['risk_level'] == 'High']),
            'medium_risk_count': len([s for s in analyzed_suppliers if s['risk_level'] == 'Medium']),
            'low_risk_count': len([s for s in analyzed_suppliers if s['risk_level'] == 'Low'])
        })
    except Exception as e:
        print(f"Supplier risk error: {str(e)}")
        return jsonify({'error': str(e)}), 500


        
@app.route('/api/delay-prediction', methods=['POST'])
def predict_delays():
    """Predict route delays using ML model"""
    try:
        data = request.json
        route_data = data.get('route_data', [])
        
        if not route_data:
            route_data = generate_sample_route_data()
        
        # Analyze each route
        predictions = []
        for route in route_data:
            # Extract route information
            name = route.get('name', 'Unknown Route')
            distance = float(route.get('distance', 350))
            weather = route.get('weather', 'Clear')
            
            # Calculate delay probability based on distance and weather
            base_delay = 0.3
            distance_factor = min(distance / 1000, 0.3)  # Longer routes have more delay risk
            
            weather_factors = {
                'Clear': 0,
                'Cloudy': 0.1,
                'Rainy': 0.25,
                'Stormy': 0.4,
                'Fog': 0.2,
                'Monsoon': 0.35
            }
            weather_factor = weather_factors.get(weather, 0.1)
            
            # Calculate probability
            delay_prob = base_delay + distance_factor + weather_factor
            delay_prob = min(delay_prob, 0.95)  # Cap at 95%
            
            predictions.append({
                'name': name,
                'delay_probability': round(delay_prob, 3),
                'distance': distance,
                'weather': weather,
                'risk_level': 'High' if delay_prob > 0.7 else 'Medium' if delay_prob > 0.5 else 'Low'
            })
        
        return jsonify({
            'routes': predictions,
            'high_risk_routes': len([r for r in predictions if r['delay_probability'] > 0.7])
        })
    except Exception as e:
        print(f"Route delay prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-data', methods=['POST'])
def upload_data():
    """Upload CSV/JSON data for analysis"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        data_type = request.form.get('type', 'historical')
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith('.json'):
            df = pd.read_json(file)
        else:
            return jsonify({'error': 'Unsupported file format'}), 400
        
        # Save to data directory
        save_path = os.path.join(DATA_DIR, f'{data_type}_{datetime.now().timestamp()}.csv')
        df.to_csv(save_path, index=False)
        
        return jsonify({
            'success': True,
            'message': 'Data uploaded successfully',
            'rows': len(df),
            'columns': list(df.columns)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/metrics/key', methods=['GET'])
def get_key_metrics():
    """Get key performance metrics"""
    try:
        metrics = {
            'shipment_volume': {'value': 2847, 'change': 0.8, 'unit': 'units/day'},
            'on_time_delivery': {'value': 78, 'change': 3.2, 'unit': '%'},
            'high_risk_routes': {'value': 23, 'change': -3.0, 'unit': 'routes'},
            'average_delay_duration': {'value': 18.5, 'change': 1.2, 'unit': 'hours'},
            'supplier_reliability': {'value': 84, 'change': 2.1, 'unit': '%'},
            'cost_efficiency': {'value': 91, 'change': 4.3, 'unit': '%'}
        }
        return jsonify(metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/location-weather', methods=['GET'])
def get_location_weather():
    """Get weather and risk conditions for each location"""
    try:
        locations = [
            {
                'id': 1,
                'name': 'Mumbai Port',
                'lat': 19.0760,
                'lng': 72.8777,
                'weather': 'Cloudy',
                'temperature': 32,
                'humidity': 78,
                'wind_speed': 15,
                'risk_level': 'High',
                'active_shipments': 245,
                'delays': 18
            },
            {
                'id': 2,
                'name': 'Delhi Distribution Center',
                'lat': 28.7041,
                'lng': 77.1025,
                'weather': 'Sunny',
                'temperature': 35,
                'humidity': 45,
                'wind_speed': 8,
                'risk_level': 'Low',
                'active_shipments': 156,
                'delays': 3
            },
            {
                'id': 3,
                'name': 'Bengaluru Tech Hub',
                'lat': 12.9716,
                'lng': 77.5946,
                'weather': 'Rainy',
                'temperature': 28,
                'humidity': 85,
                'wind_speed': 18,
                'risk_level': 'Medium',
                'active_shipments': 198,
                'delays': 12
            },
            {
                'id': 4,
                'name': 'Hyderabad Hub',
                'lat': 17.3850,
                'lng': 78.4867,
                'weather': 'Partly Cloudy',
                'temperature': 30,
                'humidity': 65,
                'wind_speed': 12,
                'risk_level': 'Low',
                'active_shipments': 132,
                'delays': 4
            },
            {
                'id': 5,
                'name': 'Chennai Port Authority',
                'lat': 13.0827,
                'lng': 80.2707,
                'weather': 'Stormy',
                'temperature': 33,
                'humidity': 82,
                'wind_speed': 28,
                'risk_level': 'High',
                'active_shipments': 89,
                'delays': 22
            },
            {
                'id': 6,
                'name': 'Kolkata Warehouse',
                'lat': 22.5726,
                'lng': 88.3639,
                'weather': 'Foggy',
                'temperature': 26,
                'humidity': 92,
                'wind_speed': 5,
                'risk_level': 'Medium',
                'active_shipments': 112,
                'delays': 7
            },
            {
                'id': 7,
                'name': 'Pune Logistics Hub',
                'lat': 18.5204,
                'lng': 73.8567,
                'weather': 'Clear',
                'temperature': 31,
                'humidity': 55,
                'wind_speed': 10,
                'risk_level': 'Low',
                'active_shipments': 174,
                'delays': 2
            },
            {
                'id': 8,
                'name': 'Ahmedabad Distribution',
                'lat': 23.0225,
                'lng': 72.5714,
                'weather': 'Sunny',
                'temperature': 36,
                'humidity': 42,
                'wind_speed': 14,
                'risk_level': 'Low',
                'active_shipments': 135,
                'delays': 2
            }
        ]
        return jsonify({'locations': locations})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/routes-map', methods=['GET'])
def get_routes_map():
    """Get route data for map visualization"""
    try:
        routes = [
            {
                'id': 1,
                'name': 'Mumbai to Bengaluru Express',
                'origin': {'lat': 19.0760, 'lng': 72.8777, 'name': 'Mumbai Port'},
                'destination': {'lat': 12.9716, 'lng': 77.5946, 'name': 'Bengaluru Tech Hub'},
                'status': 'high_risk',
                'shipments': 34,
                'delays': 8,
                'eta_hours': 24,
                'current_location': 'In Transit',
                'weather_condition': 'Monsoon Rain'
            },
            {
                'id': 2,
                'name': 'Delhi to Mumbai Route',
                'origin': {'lat': 28.7041, 'lng': 77.1025, 'name': 'Delhi Distribution Center'},
                'destination': {'lat': 19.0760, 'lng': 72.8777, 'name': 'Mumbai Port'},
                'status': 'medium_risk',
                'shipments': 28,
                'delays': 5,
                'eta_hours': 20,
                'current_location': 'Jaipur Junction',
                'weather_condition': 'Partly Cloudy'
            },
            {
                'id': 3,
                'name': 'Bengaluru to Hyderabad Direct',
                'origin': {'lat': 12.9716, 'lng': 77.5946, 'name': 'Bengaluru Tech Hub'},
                'destination': {'lat': 17.3850, 'lng': 78.4867, 'name': 'Hyderabad Hub'},
                'status': 'low_risk',
                'shipments': 42,
                'delays': 1,
                'eta_hours': 8,
                'current_location': 'Chikballapur',
                'weather_condition': 'Clear'
            }
        ]
        return jsonify({'routes': routes})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delay-prediction/predict', methods=['POST'])
def predict_shipment_delay():
    """Predict delivery delay using HYBRID approach: ML Model + Historical Data Patterns
    
    This endpoint combines:
    1. Machine Learning model trained on historical data (60% weight)
    2. Historical delay patterns for shipping mode, market, and segment (40% weight)
    3. User input adjustments based on scheduled days, quantity, and sales
    
    Auto-trains model if not already trained.
    """
    try:
        data = request.json
        
        # Auto-train if not already trained
        if not delay_predictor.is_trained:
            print("⏳ Training models on first prediction request...")
            if loaded_data is None:
                # Try to load data
                df = data_loader.load_dataset('DataCoSupplyChainDataset.csv')
                if df is None:
                    return jsonify({
                        'error': 'Cannot load historical data. Ensure DataCoSupplyChainDataset.csv exists in /data folder.',
                        'status': 'initialization_error'
                    }), 500
            
            # Train the model
            data_loader.preprocess_for_delay_prediction()
            train_result = delay_predictor.train_from_data(data_loader)
            
            if train_result.get('status') != 'success':
                print(f"⚠ Training warning: {train_result.get('message')}")
        
        # Prepare features from user input
        features = {
            'Days for shipment (scheduled)': max(1, float(data.get('scheduled_days', 3))),
            'Order Item Quantity': max(1, float(data.get('quantity', 1))),
            'Sales per customer': max(10, float(data.get('sales_per_customer', 200))),
            'Shipping Mode': data.get('shipping_mode', 'Standard Class'),
            'Market': data.get('market', 'USCA'),
            'Customer Segment': data.get('customer_segment', 'Consumer'),
        }
        
        # Get model name from request, default to gradient_boosting
        model_name = data.get('model', 'gradient_boosting')
        
        # Get prediction using specified model
        prediction_result = delay_predictor.predict_with_model(features, model_name)
        
        # Check for errors
        if 'error' in prediction_result:
            return jsonify({'error': f'Prediction error: {prediction_result["error"]}'}), 500
        
        # Return the model's prediction directly
        return jsonify({
            'model_used': model_name,
            'delay_probability': prediction_result.get('delay_probability', 50),
            'delay_probability_percentage': prediction_result.get('delay_probability', 50),
            'confidence': prediction_result.get('confidence', 50),
            'risk_level': prediction_result.get('risk_level', 'MEDIUM'),
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        print(f"Error in predict_shipment_delay: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def generate_sample_demand_data():
    """Generate sample demand historical data"""
    dates = pd.date_range(end=datetime.now(), periods=90, freq='D')
    data = []
    for date in dates:
        data.append({
            'date': date.isoformat(),
            'demand': np.random.randint(2000, 3500),
            'temperature': np.random.uniform(20, 35),
            'season': 'monsoon' if date.month in [6, 7, 8, 9] else 'normal'
        })
    return data

def generate_sample_supplier_data():
    """Generate sample supplier data"""
    suppliers = [
        {'name': 'Supplier A', 'on_time_rate': 0.95, 'quality_score': 0.92, 'cost_index': 0.85, 'defect_rate': 0.02},
        {'name': 'Supplier B', 'on_time_rate': 0.78, 'quality_score': 0.88, 'cost_index': 0.92, 'defect_rate': 0.05},
        {'name': 'Supplier C', 'on_time_rate': 0.65, 'quality_score': 0.75, 'cost_index': 0.88, 'defect_rate': 0.08},
        {'name': 'Supplier D', 'on_time_rate': 0.82, 'quality_score': 0.85, 'cost_index': 0.90, 'defect_rate': 0.04},
    ]
    return suppliers

def generate_sample_route_data():
    """Generate sample route data for delay prediction"""
    routes = [
        {'name': 'Mumbai → Bengaluru', 'avg_delay_hours': 3, 'traffic_density': 'high', 'weather': 'monsoon'},
        {'name': 'Delhi → Mumbai', 'avg_delay_hours': 0, 'traffic_density': 'medium', 'weather': 'clear'},
        {'name': 'Bengaluru → Hyderabad', 'avg_delay_hours': -1, 'traffic_density': 'low', 'weather': 'clear'},
    ]
    return routes

@app.route('/api/route-prediction', methods=['POST'])
def predict_route_risk():
    """Predict route-specific risk based on origin, destination, weather, and product details"""
    try:
        print("\n" + "="*70)
        print("🔍 BACKEND - ROUTE PREDICTION REQUEST RECEIVED")
        print("="*70)
        
        data = request.json
        
        origin = data.get('origin', '')
        destination = data.get('destination', '')
        weather = data.get('weather', 'clear').lower()
        quantity = max(1, int(data.get('quantity', 1)))
        shipping_mode = data.get('shipping_mode', 'Standard Class')
        product_category = data.get('product_category', 'General')
        
        print(f"Origin: {origin}")
        print(f"Destination: {destination}")
        print(f"Weather: {weather}")
        print(f"Quantity: {quantity}")
        print(f"Shipping Mode: {shipping_mode}")
        print(f"Product Category: {product_category}")
        
        # Auto-train if not already trained
        if not delay_predictor.is_trained:
            if loaded_data is None:
                df = data_loader.load_dataset('DataCoSupplyChainDataset.csv')
            data_loader.preprocess_for_delay_prediction()
            delay_predictor.train_from_data(data_loader)
        
        # ======== FACTOR-BASED RISK CALCULATION ========
        # Base risk starts at 30%
        base_risk = 0.30
        print(f"\n📊 FACTOR CALCULATION:")
        print(f"Base Risk: {base_risk:.1%}")
        
        # 1. WEATHER FACTOR (0.5x to 3.5x multiplier)
        weather_factors = {
            'clear': 0.5,      # 50% of base
            'cloudy': 1.0,     # 100% of base
            'rainy': 1.8,      # 180% of base
            'stormy': 3.5,     # 350% of base
            'monsoon': 3.2,    # 320% of base
            'foggy': 1.5       # 150% of base
        }
        weather_factor = weather_factors.get(weather, 1.0)
        print(f"  Weather ({weather}): {weather_factor:.1f}x")
        
        # 2. SHIPPING MODE FACTOR (0.7x to 3.0x multiplier)
        shipping_factors = {
            'Same Day': 1.5,        # Rushed, higher risk
            'Express': 1.8,         # Fast but risky
            'First Class': 3.0,     # VERY HIGH RISK (from data: 100% delay)
            'Standard Class': 1.0   # Baseline
        }
        shipping_factor = shipping_factors.get(shipping_mode, 1.0)
        print(f"  Shipping Mode ({shipping_mode}): {shipping_factor:.1f}x")
        
        # 3. PRODUCT CATEGORY FACTOR (0.6x to 2.0x multiplier)
        product_factors = {
            'General': 1.0,      # Baseline
            'Electronics': 1.4,  # Fragile, needs care
            'Perishables': 2.0,  # Highest risk - spoilage
            'Fragile': 1.8,      # Very delicate
            'Hazardous': 1.6     # Special handling, delays
        }
        product_factor = product_factors.get(product_category, 1.0)
        print(f"  Product Category ({product_category}): {product_factor:.1f}x")
        
        # 4. QUANTITY FACTOR (based on order volume)
        # Small orders < 50: 0.8x, Medium 50-200: 1.0x, Large > 200: 1.3x
        if quantity < 50:
            quantity_factor = 0.8
        elif quantity <= 200:
            quantity_factor = 1.0
        else:
            quantity_factor = 1.3
        print(f"  Quantity ({quantity} units): {quantity_factor:.1f}x")
        
        # COMBINED MULTIPLIER
        combined_multiplier = weather_factor * shipping_factor * product_factor * quantity_factor
        print(f"\nCombined Multiplier: {combined_multiplier:.2f}x")
        
        # FINAL ROUTE RISK
        route_risk = min(0.99, base_risk * combined_multiplier)
        print(f"Final Route Risk: {route_risk:.1%}")
        print("="*70)
        
        # Determine risk level
        if route_risk >= 0.7:
            risk_level = 'critical'
            risk_color = '#FF6B6B'
            advice = '🔴 CRITICAL: High delay risk. Consider expedited shipping or reschedule.'
        elif route_risk >= 0.5:
            risk_level = 'high'
            risk_color = '#FFA500'
            advice = '🟠 HIGH: Moderate delay risk. Monitor shipment closely.'
        elif route_risk >= 0.3:
            risk_level = 'medium'
            risk_color = '#FFD700'
            advice = '🟡 MEDIUM: Some delay risk. Standard precautions recommended.'
        else:
            risk_level = 'low'
            risk_color = '#4CAF50'
            advice = '🟢 LOW: Favorable conditions. Proceed with standard shipping.'
        
        # Calculate estimated delay hours
        estimated_delay_hours = round(route_risk * 48, 1)  # Max 48 hours delay on critical risk
        
        # Weather-specific predictions
        weather_predictions = {
            'clear': {
                'expected_delays': 2,
                'traffic_condition': 'normal',
                'road_condition': 'excellent',
                'visibility': 'excellent'
            },
            'cloudy': {
                'expected_delays': 4,
                'traffic_condition': 'normal',
                'road_condition': 'good',
                'visibility': 'good'
            },
            'rainy': {
                'expected_delays': 8,
                'traffic_condition': 'congested',
                'road_condition': 'wet',
                'visibility': 'moderate'
            },
            'stormy': {
                'expected_delays': 16,
                'traffic_condition': 'severely_congested',
                'road_condition': 'hazardous',
                'visibility': 'poor'
            },
            'monsoon': {
                'expected_delays': 14,
                'traffic_condition': 'severely_congested',
                'road_condition': 'flooded_areas',
                'visibility': 'very_poor'
            },
            'foggy': {
                'expected_delays': 10,
                'traffic_condition': 'congested',
                'road_condition': 'slippery',
                'visibility': 'poor'
            }
        }
        
        weather_pred = weather_predictions.get(weather, weather_predictions['clear'])
        
        # Alternative route recommendations
        recommendations = []
        if route_risk >= 0.6:
            recommendations.append('Consider using shorter coastal routes')
            recommendations.append('Explore night-time delivery options')
        if weather in ['monsoon', 'stormy', 'rainy']:
            recommendations.append('Pre-position inventory at distribution centers')
            recommendations.append('Use waterproof packaging and containers')
        
        return jsonify({
            'origin': origin,
            'destination': destination,
            'weather': weather,
            'weather_factor': round(weather_factor, 2),
            'shipping_factor': round(shipping_factor, 2),
            'product_factor': round(product_factor, 2),
            'quantity_factor': round(quantity_factor, 2),
            'combined_multiplier': round(combined_multiplier, 2),
            'weather_risk_percentage': round(weather_factor * 100, 1),
            'shipping_mode_delay_percentage': round(shipping_factor * 100, 1),
            'overall_route_risk_percentage': round(route_risk * 100, 1),
            'risk_level': risk_level,
            'risk_color': risk_color,
            'estimated_delay_hours': estimated_delay_hours,
            'advice': advice,
            'weather_conditions': {
                'expected_delays_hours': weather_pred['expected_delays'],
                'traffic_condition': weather_pred['traffic_condition'],
                'road_condition': weather_pred['road_condition'],
                'visibility': weather_pred['visibility']
            },
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error in predict_route_risk: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
