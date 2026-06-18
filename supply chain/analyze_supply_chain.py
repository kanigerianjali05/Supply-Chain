#!/usr/bin/env python3
"""
Data Analysis and Model Training Script
Loads the historical supply chain dataset and trains all ML models
"""

import sys
import os

# Add backend to path
backend_path = os.path.join(os.path.dirname(__file__), 'backend')
sys.path.insert(0, backend_path)

from models.data_loader import DataLoader
from models.delay_predictor import DelayPredictor
import pandas as pd

def main():
    print("=" * 80)
    print("SUPPLY CHAIN DATA ANALYSIS & MODEL TRAINING")
    print("=" * 80)
    print()
    
    # Initialize data loader
    print("Step 1: Loading historical dataset...")
    print("-" * 80)
    data_loader = DataLoader(data_dir='./data')
    df = data_loader.load_dataset()
    
    if df is None:
        print("✗ Failed to load dataset. Exiting.")
        return
    
    print()
    
    # Display basic statistics
    print("Step 2: Dataset Overview")
    print("-" * 80)
    stats = data_loader.get_statistics()
    
    print(f"Total Records: {stats['total_records']:,}")
    print(f"Unique Orders: {stats['total_orders']:,}")
    print(f"Unique Customers: {stats['unique_customers']:,}")
    print(f"Late Delivery Rate: {stats['late_delivery_rate']*100:.2f}%")
    print(f"Average Shipping Days (Real): {stats['avg_shipping_days_real']:.2f}")
    print(f"Average Shipping Days (Scheduled): {stats['avg_shipping_days_scheduled']:.2f}")
    print(f"Total Sales Value: ${stats['total_sales']:,.0f}")
    print(f"Average Order Value: ${stats['avg_order_value']:.2f}")
    
    print()
    print("Delivery Statuses:")
    for status, count in stats['delivery_statuses'].items():
        print(f"  - {status}: {count:,}")
    
    print()
    print("Top 5 Markets:")
    for market, count in list(stats['top_markets'].items())[:5]:
        print(f"  - {market}: {count:,}")
    
    print()
    
    # Analyze delays
    print("Step 3: Delay Pattern Analysis")
    print("-" * 80)
    data_loader.preprocess_for_delay_prediction()
    delay_analysis = data_loader.get_delay_analysis()
    
    print(f"Total Delayed Orders: {delay_analysis['total_delayed_orders']:,}")
    print(f"On-Time Orders: {delay_analysis['on_time_orders']:,}")
    print(f"Delay Percentage: {delay_analysis['delay_percentage']:.2f}%")
    print(f"Average Delay (days): {delay_analysis['avg_delay_days']:.2f}")
    print(f"Maximum Delay (days): {delay_analysis['max_delay_days']:.0f}")
    
    print()
    print("Top Delays by Shipping Mode:")
    for mode, count in list(delay_analysis['delays_by_shipping_mode'].items())[:5]:
        print(f"  - {mode}: {count:,} delayed shipments")
    
    print()
    print("Top Delays by Market:")
    for market, count in list(delay_analysis['delays_by_market'].items())[:5]:
        print(f"  - {market}: {count:,} delayed shipments")
    
    print()
    
    # Customer segment analysis
    print("Step 4: Customer Segment Analysis")
    print("-" * 80)
    segments = data_loader.get_customer_segments_analysis()
    
    for segment, data in segments.items():
        print(f"\n{segment}:")
        print(f"  - Count: {data['count']:,}")
        print(f"  - Avg Order Value: ${data['avg_order_value']:.2f}")
        print(f"  - Late Delivery Rate: {data['late_delivery_rate']*100:.2f}%")
        if data['top_product']:
            print(f"  - Top Product: {data['top_product']}")
    
    print()
    
    # Train delay predictor
    print("Step 5: Training Delay Prediction Model")
    print("-" * 80)
    delay_predictor = DelayPredictor()
    train_result = delay_predictor.train_from_data(data_loader)
    
    if train_result['status'] == 'success':
        print(f"✓ Model trained successfully!")
        print(f"  - Training samples: {train_result['training_samples']:,}")
        print(f"  - Test samples: {train_result['test_samples']:,}")
        print(f"  - Train accuracy: {train_result['train_accuracy']*100:.2f}%")
        print(f"  - Test accuracy: {train_result['test_accuracy']*100:.2f}%")
        print(f"  - Features used: {train_result['feature_count']}")
        
        # Get model insights
        print()
        print("Step 6: Delay Prediction Insights")
        print("-" * 80)
        insights = delay_predictor.get_model_insights()
        
        print("\nDelay Rates by Shipping Mode:")
        for mode, rate in insights['shipping_mode_delays'].items():
            print(f"  - {mode}: {rate:.2f}%")
        
        print()
    else:
        print(f"✗ Training failed: {train_result['message']}")
    
    print()
    print("Step 7: Export Training Data")
    print("-" * 80)
    export_path = data_loader.export_training_data()
    print(f"✓ Training data exported to {export_path}")
    
    print()
    print("=" * 80)
    print("ANALYSIS COMPLETE!")
    print("=" * 80)
    print()
    print("Next steps:")
    print("1. Start the Flask server: python backend/app.py")
    print("2. Load data in API: POST /api/data/load-historical")
    print("3. Train models: POST /api/data/train-models")
    print("4. Make predictions: POST /api/delay-prediction/batch")
    print()

if __name__ == '__main__':
    main()
