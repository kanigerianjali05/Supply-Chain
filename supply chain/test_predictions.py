#!/usr/bin/env python3
"""
Test Script for Supply Chain Prediction System
Demonstrates how to make predictions using the trained ML model
"""

import sys
import os
import json

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

from models.data_loader import DataLoader
from models.delay_predictor import DelayPredictor
import pandas as pd

def test_delay_predictions():
    """Test delay predictions with sample shipments"""
    
    print("=" * 80)
    print("TESTING DELAY PREDICTION SYSTEM")
    print("=" * 80)
    print()
    
    # Initialize
    print("Step 1: Initialize Models")
    print("-" * 80)
    data_loader = DataLoader(data_dir='./data')
    delay_predictor = DelayPredictor()
    
    # Check if model is loaded
    if delay_predictor.is_trained:
        print("✓ Pre-trained model loaded successfully")
    else:
        print("Loading and training model from historical data...")
        df = data_loader.load_dataset()
        data_loader.preprocess_for_delay_prediction()
        result = delay_predictor.train_from_data(data_loader)
        if result['status'] == 'success':
            print(f"✓ Model trained: {result}")
    
    print()
    
    # Test Cases
    print("Step 2: Test Predictions on Sample Shipments")
    print("-" * 80)
    print()
    
    test_cases = [
        {
            'name': 'Express Shipment - Consumer, Standard Class',
            'features': {
                'Days for shipment (scheduled)': 2,
                'Days for shipping (real)': 2,
                'Order Item Quantity': 1,
                'Sales per customer': 100.0,
                'shipping_mode_encoded': 3,  # Standard Class
                'order_status_encoded': 0,
                'customer_segment_encoded': 0,  # Consumer
                'order_day_of_week': 2,  # Wednesday
                'order_month': 6,
                'order_quarter': 2,
                'Order Item Discount Rate': 0.0,
                'Order Item Profit Ratio': 0.5
            }
        },
        {
            'name': 'Standard Shipment - Corporate, First Class',
            'features': {
                'Days for shipment (scheduled)': 3,
                'Days for shipping (real)': 3,
                'Order Item Quantity': 5,
                'Sales per customer': 500.0,
                'shipping_mode_encoded': 0,  # First Class
                'order_status_encoded': 0,
                'customer_segment_encoded': 2,  # Corporate
                'order_day_of_week': 0,  # Monday
                'order_month': 3,
                'order_quarter': 1,
                'Order Item Discount Rate': 0.1,
                'Order Item Profit Ratio': 0.3
            }
        },
        {
            'name': 'Bulk Order - Home Office, Second Class',
            'features': {
                'Days for shipment (scheduled)': 5,
                'Days for shipping (real)': 7,
                'Order Item Quantity': 50,
                'Sales per customer': 2000.0,
                'shipping_mode_encoded': 2,  # Second Class
                'order_status_encoded': 0,
                'customer_segment_encoded': 1,  # Home Office
                'order_day_of_week': 4,  # Friday
                'order_month': 12,
                'order_quarter': 4,
                'Order Item Discount Rate': 0.2,
                'Order Item Profit Ratio': 0.2
            }
        },
        {
            'name': 'Same-Day Delivery - Consumer, Discounted',
            'features': {
                'Days for shipment (scheduled)': 1,
                'Days for shipping (real)': 1,
                'Order Item Quantity': 1,
                'Sales per customer': 50.0,
                'shipping_mode_encoded': 1,  # Same Day
                'order_status_encoded': 0,
                'customer_segment_encoded': 0,  # Consumer
                'order_day_of_week': 1,  # Tuesday
                'order_month': 7,
                'order_quarter': 3,
                'Order Item Discount Rate': 0.3,
                'Order Item Profit Ratio': 0.15
            }
        }
    ]
    
    predictions = []
    for test_case in test_cases:
        print(f"📦 {test_case['name']}")
        print("-" * 40)
        
        prediction = delay_predictor.predict(test_case['features'])
        predictions.append({
            'name': test_case['name'],
            'prediction': prediction
        })
        
        if 'error' not in prediction:
            print(f"  Delay Probability: {prediction['delay_probability']:.2f}%")
            print(f"  Confidence: {prediction['confidence']:.2f}%")
            print(f"  Risk Level: {prediction['risk_level']['level']}")
            
            # Show top features
            if prediction['feature_importance']:
                print(f"  Top Contributing Factors:")
                for feat in prediction['feature_importance'][:3]:
                    print(f"    - {feat['feature']}: {feat['importance']:.4f}")
            
            # Suggest actions
            risk_level = prediction['risk_level']['level']
            actions = delay_predictor.get_mitigation_actions(risk_level)
            if actions.get('immediate'):
                print(f"  🚨 Immediate Actions ({len(actions['immediate'])}):")
                for action in actions['immediate'][:2]:
                    print(f"    - {action}")
        else:
            print(f"  ⚠️  Error: {prediction.get('error', 'Unknown error')}")
        
        print()
    
    # Summary Report
    print()
    print("Step 3: Risk Summary")
    print("-" * 80)
    
    high_risk = sum(1 for p in predictions 
                   if p['prediction'].get('delay_probability', 0) > 70)
    medium_risk = sum(1 for p in predictions 
                     if 40 <= p['prediction'].get('delay_probability', 0) <= 70)
    low_risk = sum(1 for p in predictions 
                  if p['prediction'].get('delay_probability', 0) < 40)
    
    print(f"\nRisk Distribution:")
    print(f"  🔴 High Risk (>70%): {high_risk} shipments")
    print(f"  🟡 Medium Risk (40-70%): {medium_risk} shipments")
    print(f"  🟢 Low Risk (<40%): {low_risk} shipments")
    
    avg_prob = sum(p['prediction'].get('delay_probability', 0) 
                   for p in predictions) / len(predictions)
    print(f"\n  Average Delay Probability: {avg_prob:.2f}%")
    
    # Model Insights
    print()
    print("Step 4: Model Insights")
    print("-" * 80)
    
    insights = delay_predictor.get_model_insights()
    
    print(f"\nShipping Mode Delay Rates:")
    if insights['shipping_mode_delays']:
        for mode, rate in sorted(insights['shipping_mode_delays'].items(), 
                                key=lambda x: x[1], reverse=True):
            print(f"  - {mode}: {rate:.2f}%")
    
    print(f"\nTop Market Risk Levels:")
    if insights['market_delays']:
        for market, rate in sorted(insights['market_delays'].items(), 
                                  key=lambda x: x[1], reverse=True)[:5]:
            print(f"  - {market}: {rate:.2f}%")
    
    print(f"\nCustomer Segment Risk Levels:")
    if insights['segment_delays']:
        for segment, rate in sorted(insights['segment_delays'].items(), 
                                    key=lambda x: x[1], reverse=True):
            print(f"  - {segment}: {rate:.2f}%")
    
    print()
    print("=" * 80)
    print("TEST COMPLETE!")
    print("=" * 80)
    print()
    
    # Save results
    with open('test_results.json', 'w') as f:
        results = {
            'summary': {
                'total_tests': len(predictions),
                'high_risk': high_risk,
                'medium_risk': medium_risk,
                'low_risk': low_risk,
                'avg_delay_probability': round(avg_prob, 2)
            },
            'predictions': [
                {
                    'name': p['name'],
                    'delay_probability': p['prediction'].get('delay_probability'),
                    'confidence': p['prediction'].get('confidence'),
                    'risk_level': p['prediction'].get('risk_level', {}).get('level')
                }
                for p in predictions
            ],
            'model_insights': {
                'is_trained': insights['is_trained'],
                'shipping_mode_delays': insights['shipping_mode_delays'],
                'market_delays': insights['market_delays'],
                'customer_segment_delays': insights['segment_delays']
            }
        }
        json.dump(results, f, indent=2)
    
    print("✓ Results saved to test_results.json")
    print()

if __name__ == '__main__':
    test_delay_predictions()
