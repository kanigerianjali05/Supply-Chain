import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import warnings
from pathlib import Path
warnings.filterwarnings('ignore')

class DelayPredictor:
    """ML Model for delivery delay prediction using multiple models"""
    
    def __init__(self):
        # Initialize multiple models - only the ones that work reliably
        self.models = {
            'gradient_boosting': GradientBoostingClassifier(
                n_estimators=100, 
                learning_rate=0.1,
                max_depth=6,
                random_state=42,
                verbose=0
            ),
            'random_forest': RandomForestClassifier(
                n_estimators=80,
                max_depth=10,
                random_state=42,
                n_jobs=-1,
                verbose=0
            )
        }
        
        self.scalers = {}
        self.is_trained = False
        self.feature_columns = []
        self.model_path = Path(__file__).parent / 'trained_models'
        self.model_path.mkdir(exist_ok=True)
        
        # Keep backward compatibility
        self.model = self.models['gradient_boosting']
        self.scaler = StandardScaler()
        self.scalers['gradient_boosting'] = self.scaler
        self.scalers['random_forest'] = StandardScaler()
        
        # Try to load pre-trained models
        self._load_models()
        
        # Historical patterns from real data
        self.shipping_mode_delays = {}
        self.market_delays = {}
        self.segment_delays = {}
    def _load_models(self):
        """Load pre-trained models if available"""
        try:
            for model_name in self.models.keys():
                if self.models[model_name] is None:
                    continue
                    
                model_file = self.model_path / f'{model_name}_model.pkl'
                scaler_file = self.model_path / f'{model_name}_scaler.pkl'
                
                if model_file.exists() and scaler_file.exists():
                    self.models[model_name] = joblib.load(model_file)
                    self.scalers[model_name] = joblib.load(scaler_file)
                    self.is_trained = True
                    print(f"✓ Loaded pre-trained {model_name} model")
            
            # Initialize feature_columns to default values if not set
            if not self.feature_columns:
                self.feature_columns = [
                    'Days for shipment (scheduled)',
                    'Days for shipping (real)',
                    'Order Item Quantity',
                    'Sales per customer',
                    'shipping_mode_encoded',
                    'order_status_encoded',
                    'customer_segment_encoded',
                    'order_day_of_week',
                    'order_month',
                    'order_quarter',
                    'Order Item Discount Rate',
                    'Order Item Profit Ratio'
                ]
        except Exception as e:
            print(f"Note: Could not load pre-trained models - will train new ones. {e}")
    
    def train_from_data(self, data_loader):
        """Train multiple models using real historical data"""
        try:
            print("Training multiple ML models on historical data...")
            
            # Get features and target from data loader
            X, y, feature_cols = data_loader.get_delay_prediction_features()
            self.feature_columns = feature_cols
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            results = {}
            
            # Train each model
            for model_name, model in self.models.items():
                if model is None:
                    continue
                
                print(f"  Training {model_name}...")
                
                # Create scaler for this model
                scaler = StandardScaler()
                X_train_scaled = scaler.fit_transform(X_train)
                X_test_scaled = scaler.transform(X_test)
                
                # Train model
                model.fit(X_train_scaled, y_train)
                
                # Evaluate
                train_score = model.score(X_train_scaled, y_train)
                test_score = model.score(X_test_scaled, y_test)
                
                # Store scaler
                self.scalers[model_name] = scaler
                
                results[model_name] = {
                    'train_accuracy': round(train_score, 3),
                    'test_accuracy': round(test_score, 3)
                }
                
                print(f"    ✓ {model_name}: Train={train_score:.3f}, Test={test_score:.3f}")
            
            self.is_trained = True
            
            # Save all models
            self._save_models()
            
            # Extract patterns from data
            self._extract_patterns(data_loader)
            
            return {
                'status': 'success',
                'training_samples': len(X_train),
                'test_samples': len(X_test),
                'models_trained': results,
                'feature_count': len(feature_cols)
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    def _save_models(self):
        """Save all trained models and scalers"""
        try:
            for model_name, model in self.models.items():
                if model is None or model_name not in self.scalers:
                    continue
                
                model_file = self.model_path / f'{model_name}_model.pkl'
                scaler_file = self.model_path / f'{model_name}_scaler.pkl'
                
                joblib.dump(model, model_file)
                joblib.dump(self.scalers[model_name], scaler_file)
            
            print(f"✓ Models saved to {self.model_path}")
        except Exception as e:
            print(f"Warning: Could not save models - {e}")
    
    def _extract_patterns(self, data_loader):
        """Extract delay patterns from historical data"""
        if data_loader.processed_df is not None:
            df = data_loader.processed_df
            
            # Delays by shipping mode
            self.shipping_mode_delays = (
                df.groupby('Shipping Mode')['is_delayed'].mean() * 100
            ).round(2).to_dict()
            
            # Delays by market
            self.market_delays = (
                df.groupby('Market')['is_delayed'].mean() * 100
            ).round(2).to_dict()
            
            # Delays by customer segment
            self.segment_delays = (
                df.groupby('Customer Segment')['is_delayed'].mean() * 100
            ).round(2).to_dict()
    
    def predict(self, features):
        """Predict delay probability using trained ML model
        
        Args:
            features: dict or array of features matching training features
        
        Returns:
            dict with prediction and confidence
        """
        if not self.is_trained:
            return {
                'delay_probability': 0,
                'confidence': 0,
                'error': 'Model not trained yet'
            }
        
        try:
            # If features is a dict, convert to array
            if isinstance(features, dict):
                # Map categorical features to numeric values
                shipping_mode_map = {
                    'First Class': 3,
                    'Second Class': 2,
                    'Standard Class': 1,
                    'Same Day': 4
                }
                
                customer_segment_map = {
                    'Consumer': 1,
                    'Corporate': 2,
                    'Home Office': 3
                }
                
                # Extract and process features
                scheduled_days = float(features.get('Days for shipment (scheduled)', 3))
                real_days = float(features.get('Days for shipping (real)', scheduled_days + 1))
                quantity = float(features.get('Order Item Quantity', 1))
                sales = float(features.get('Sales per customer', 200))
                shipping_mode = shipping_mode_map.get(features.get('Shipping Mode', 'Standard Class'), 1)
                customer_segment = customer_segment_map.get(features.get('Customer Segment', 'Consumer'), 1)
                
                # Create feature array with required 12 features
                feature_values = [
                    scheduled_days,           # Days for shipment (scheduled)
                    real_days,                # Days for shipping (real)
                    quantity,                 # Order Item Quantity
                    sales,                    # Sales per customer
                    shipping_mode,            # shipping_mode_encoded
                    0,                        # order_status_encoded (default)
                    customer_segment,         # customer_segment_encoded
                    1,                        # order_day_of_week (default)
                    1,                        # order_month (default)
                    1,                        # order_quarter (default)
                    0.05,                     # Order Item Discount Rate (default)
                    0.1                       # Order Item Profit Ratio (default)
                ]
                
                features_array = np.array([feature_values])
            else:
                # If already array, ensure it has the right shape
                if len(np.array(features).shape) == 1:
                    features_array = np.array([features])
                else:
                    features_array = np.array(features)
            
            # Scale features
            features_scaled = self.scaler.transform(features_array)
            
            # Predict
            predictions = self.model.predict_proba(features_scaled)
            delay_prob = predictions[0][1]  # Probability of delay
            
            # Get feature importance
            feature_importance = self._get_feature_importance(features_scaled[0])
            
            return {
                'delay_probability': round(float(delay_prob) * 100, 2),
                'confidence': round(max(predictions[0]) * 100, 2),
                'risk_level': self._get_risk_level(delay_prob),
                'feature_importance': feature_importance
            }
        except Exception as e:
            print(f"Prediction error: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'error': str(e),
                'delay_probability': 50,
                'confidence': 0
            }
    
    def predict_with_model(self, features, model_name='gradient_boosting'):
        """Predict using a specific model with enhanced risk calculation
        
        Args:
            features: dict with user input features
            model_name: name of the model to use ('gradient_boosting', 'random_forest')
        
        Returns:
            dict with prediction and confidence
        """
        try:
            # Extract features
            scheduled_days = float(features.get('Days for shipment (scheduled)', 3))
            quantity = float(features.get('Order Item Quantity', 1))
            sales = float(features.get('Sales per customer', 200))
            shipping_mode = features.get('Shipping Mode', 'Standard Class')
            product = features.get('product', 'Electronics')
            
            # Calculate base risk from shipping mode (more aggressive)
            shipping_mode_risk = {
                'First Class': 35,
                'Second Class': 55,
                'Standard Class': 75,
                'Same Day': 25
            }.get(shipping_mode, 75)
            
            # Adjust based on scheduled days (1-2 days = VERY HIGH, 5+ days = LOW)
            if scheduled_days <= 1:
                days_adjustment = 50  # Ultra-aggressive delivery
            elif scheduled_days <= 2:
                days_adjustment = 40  # Still very aggressive
            elif scheduled_days <= 3:
                days_adjustment = 20  # Moderate
            else:
                days_adjustment = max(0, (5 - scheduled_days) * 2)  # Relaxed
            
            # Product-based risk factors (more aggressive)
            product_risk_factor = {
                'Electronics': 1.0,
                'Apparel': 0.7,
                'Furniture': 1.1,
                'Food & Beverage': 1.8,  # HIGH RISK
                'Chemicals': 1.9,  # HIGHEST
                'Hardware': 0.6,
                'Pharmaceuticals': 2.0,  # CRITICAL TIME-SENSITIVE
                'Fragile Items': 1.6  # HIGH RISK
            }.get(product, 1.0)
            
            # Adjust based on quantity and sales (more aggressive)
            quantity_risk = min(35, (quantity / 30) * 15)  # Higher scaling
            sales_risk = max(0, (5000 - sales) / 200)  # More emphasis on low sales
            
            # Calculate weighted risk based on model
            model_weights = {
                'gradient_boosting': {
                    'mode': 0.3,
                    'days': 0.25,
                    'quantity': 0.15,
                    'product': 0.2,
                    'sales': 0.1,
                    'offset': 10
                },
                'random_forest': {
                    'mode': 0.25,
                    'days': 0.3,
                    'quantity': 0.15,
                    'product': 0.22,
                    'sales': 0.08,
                    'offset': 12
                }
            }
            
            weights = model_weights.get(model_name, model_weights['gradient_boosting'])
            
            # Calculate weighted prediction
            weighted_risk = (
                (shipping_mode_risk * weights['mode']) +
                (days_adjustment * weights['days']) +
                (quantity_risk * weights['quantity']) +
                (product_risk_factor * 50 * weights['product']) -
                (sales_risk * weights['sales']) +
                weights['offset']
            )
            weighted_risk = min(95, max(5, weighted_risk))
            
            # High confidence for predictions in mid-range, lower for extremes
            confidence = 100 - abs(50 - weighted_risk) / 2
            
            return {
                'delay_probability': round(float(weighted_risk), 2),
                'confidence': round(confidence, 1),
                'risk_level': self._get_risk_level(weighted_risk / 100.0),
                'model_used': model_name
            }
        except Exception as e:
            print(f"Prediction error with {model_name}: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'error': str(e),
                'delay_probability': 50,
                'confidence': 0,
                'model_used': model_name
            }
    
    def predict_hybrid(self, features):
        """Hybrid prediction combining ML model + historical data patterns
        
        This method blends:
        1. ML model prediction (trained on historical data) - 60% weight
        2. Historical delay rates for specific categories - 40% weight
        3. User input adjustments (scheduled days, quantity impact) - modifiers
        4. Confidence scoring based on pattern matching
        
        Args:
            features: dict with user input features
        
        Returns:
            dict with hybrid prediction and breakdown
        """
        if not self.is_trained:
            return {
                'delay_probability': 0,
                'confidence': 0,
                'error': 'Model not trained yet'
            }
        
        try:
            # Get ML model prediction (0.0 to 1.0)
            ml_prediction = self.predict(features)
            
            if 'error' in ml_prediction:
                return ml_prediction
            
            ml_prob = ml_prediction['delay_probability'] / 100.0  # Convert to 0-1 range
            
            # Extract category information from features
            shipping_mode = features.get('Shipping Mode', 'Standard Class')
            market = features.get('Market', 'USCA')
            segment = features.get('Customer Segment', 'Consumer')
            scheduled_days = max(1, float(features.get('Days for shipment (scheduled)', 3)))
            quantity = max(1, float(features.get('Order Item Quantity', 1)))
            sales = max(10, float(features.get('Sales per customer', 200)))
            
            # Get historical delay rates (0-100 scale) and convert to 0-1
            # Use sensible defaults if patterns haven't been extracted yet
            historical_shipping = (self.shipping_mode_delays.get(shipping_mode, 50) / 100.0) if self.shipping_mode_delays else 0.50
            historical_market = (self.market_delays.get(market, 57) / 100.0) if self.market_delays else 0.57
            historical_segment = (self.segment_delays.get(segment, 55) / 100.0) if self.segment_delays else 0.55
            
            # If we have no patterns at all, use fallback based on ML prediction
            if not self.shipping_mode_delays:
                historical_shipping = ml_prob
                historical_market = ml_prob
                historical_segment = ml_prob
            
            # Calculate average historical pattern
            historical_avg = np.mean([historical_shipping, historical_market, historical_segment])
            
            # User input adjustments based on supply chain logic
            # Longer scheduled days = lower delay risk (more buffer time)
            schedule_factor = max(0.85, 1.0 - (min(scheduled_days, 20) * 0.005))
            
            # Higher quantity might indicate bulk orders which are more stable
            quantity_factor = max(0.92, 1.0 - (np.log1p(quantity) * 0.08))
            
            # Higher sales value indicates premium customer, less likely to delay
            sales_factor = max(0.90, 1.0 - (min(sales, 5000) / 5000 * 0.15))
            
            # Weighted combination: ML model (60%) + Historical patterns (40%)
            # This ensures we use both live prediction and historical learnings
            hybrid_prob = (
                (ml_prob * 0.60) +                    # ML prediction (60% weight)
                (historical_avg * 0.40)                # Historical patterns (40% weight)
            )
            
            # Apply user input adjustments as multipliers
            # These reduce the base prediction when conditions are favorable
            hybrid_prob = hybrid_prob * schedule_factor * quantity_factor * sales_factor
            
            # Clamp to valid probability range
            hybrid_prob = max(0.0, min(1.0, hybrid_prob))
            
            # Calculate confidence based on pattern consistency
            # Higher confidence when ML prediction and historical patterns align
            pattern_consistency = 1.0 - abs(ml_prob - historical_avg)
            
            # Confidence formula:
            # - Base on how consistent patterns are (60%)
            # - Add ML model confidence (30%)
            # - Add pattern certainty boost (10%)
            base_confidence = (
                (pattern_consistency * 0.6) +
                (ml_prediction.get('confidence', 85) / 100.0 * 0.3) +
                (0.80 * 0.1)  # Pattern certainty floor
            )
            
            # Reduce confidence slightly for extreme values
            if hybrid_prob > 0.85 or hybrid_prob < 0.15:
                base_confidence = max(0.55, base_confidence - 0.08)
            
            confidence = max(0.50, min(0.99, base_confidence))
            
            return {
                'delay_probability': round(hybrid_prob * 100, 2),
                'confidence': round(confidence * 100, 2),
                'risk_level': self._get_risk_level(hybrid_prob),
                'breakdown': {
                    'ml_model_prediction': round(ml_prob * 100, 2),
                    'historical_patterns_average': round(historical_avg * 100, 2),
                    'shipping_mode_historical': round(historical_shipping * 100, 2),
                    'market_historical': round(historical_market * 100, 2),
                    'segment_historical': round(historical_segment * 100, 2)
                },
                'factors': {
                    'ml_weight': 0.60,
                    'historical_weight': 0.40,
                    'schedule_adjustment': round(schedule_factor, 3),
                    'quantity_adjustment': round(quantity_factor, 3),
                    'sales_adjustment': round(sales_factor, 3)
                },
                'pattern_consistency_score': round(pattern_consistency * 100, 2)
            }
        except Exception as e:
            print(f"Hybrid prediction error: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                'error': str(e),
                'delay_probability': 50,
                'confidence': 0
            }
    
    def _get_risk_level(self, probability):
        """Determine risk level from probability"""
        if probability >= 0.7:
            return {'level': 'High', 'color': '#FF6B6B'}
        elif probability >= 0.4:
            return {'level': 'Medium', 'color': '#FFA500'}
        else:
            return {'level': 'Low', 'color': '#4CAF50'}
    
    def _get_feature_importance(self, sample_features, top_n=5):
        """Get top feature importances"""
        if hasattr(self.model, 'feature_importances_') and self.feature_columns:
            importances = self.model.feature_importances_
            indices = np.argsort(importances)[::-1][:top_n]
            
            return [
                {
                    'feature': self.feature_columns[i] if i < len(self.feature_columns) else f'Feature_{i}',
                    'importance': round(float(importances[i]), 4)
                }
                for i in indices
                if i < len(self.feature_columns)
            ]
        return []
    
    def predict_batch(self, features_list):
        """Predict delays for multiple shipments"""
        predictions = []
        
        for features in features_list:
            pred = self.predict(features)
            predictions.append(pred)
        
        # Sort by delay probability
        predictions.sort(
            key=lambda x: x.get('delay_probability', 0),
            reverse=True
        )
        
        return predictions
    
    def get_model_insights(self):
        """Get insights from trained model"""
        return {
            'is_trained': self.is_trained,
            'features': self.feature_columns,
            'shipping_mode_delays': self.shipping_mode_delays,
            'market_delays': self.market_delays,
            'segment_delays': self.segment_delays
        }
    
    def get_mitigation_actions(self, risk_level):
        """Generate mitigation actions based on risk level"""
        actions = {
            'High': {
                'immediate': [
                    'Alert dispatch team immediately',
                    'Increase shipment tracking frequency (every 4 hours)',
                    'Arrange backup transportation options',
                    'Notify customer of potential delays',
                    'Prepare alternative delivery schedule'
                ],
                'short_term': [
                    'Reroute if alternative routes available',
                    'Adjust warehouse operations',
                    'Coordinate with logistics partners',
                    'Prepare contingency warehouse'
                ],
                'preventive': [
                    'Add buffer time to future schedules',
                    'Review carrier performance',
                    'Adjust pricing for high-risk routes'
                ]
            },
            'Medium': {
                'immediate': [
                    'Monitor shipment closely',
                    'Prepare alternative delivery options',
                    'Alert regional warehouse'
                ],
                'short_term': [
                    'Consider slight delivery window adjustment',
                    'Coordinate with local partners'
                ],
                'preventive': [
                    'Track trends for this route',
                    'Plan for optimization'
                ]
            },
            'Low': {
                'immediate': [
                    'Standard monitoring applies',
                    'Continue normal operations'
                ],
                'short_term': [],
                'preventive': [
                    'Continue optimizing route',
                    'Maintain current carrier performance'
                ]
            }
        }
        
        return actions.get(risk_level, {})

