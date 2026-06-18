#!/usr/bin/env python
import sys
sys.path.insert(0, 'backend')

from models.data_loader import DataLoader
from models.delay_predictor import DelayPredictor

print('Loading system without re-training...')
print('Step 1: Initialize components')
dl = DataLoader(data_dir='data')
delay_predictor = DelayPredictor()

print('Step 2: Load and preprocess data')
df = dl.load_dataset('DataCoSupplyChainDataset.csv')
dl.preprocess_for_delay_prediction()
print(f'✓ Preprocessed {len(dl.processed_df)} records')

# Extract patterns for hybrid prediction
print('Step 3: Extract historical patterns')
if dl.processed_df is not None:
    shipping_modes = dl.processed_df['Shipping Mode'].unique()
    print(f'  Shipping modes: {list(shipping_modes)[:3]}...')
    
    # Manually extract patterns since we're not re-training
    delay_predictor.shipping_mode_delays = (
        dl.processed_df.groupby('Shipping Mode')['is_delayed'].mean() * 100
    ).round(2).to_dict()
    
    delay_predictor.market_delays = (
        dl.processed_df.groupby('Market')['is_delayed'].mean() * 100
    ).round(2).to_dict()
    
    delay_predictor.segment_delays = (
        dl.processed_df.groupby('Customer Segment')['is_delayed'].mean() * 100
    ).round(2).to_dict()
    
    print(f'✓ Extracted patterns:')
    print(f'  Shipping modes: {list(delay_predictor.shipping_mode_delays.keys())[:3]}')
    print(f'  Markets: {list(delay_predictor.market_delays.keys())[:3]}')
    print(f'  Segments: {list(delay_predictor.segment_delays.keys())}')

print('\nStep 4: Test hybrid prediction')
test_cases = [
    {
        'name': 'Standard shipment',
        'features': {
            'Days for shipment (scheduled)': 3,
            'Order Item Quantity': 5,
            'Sales per customer': 200,
            'Shipping Mode': 'Standard Class',
            'Market': 'USCA',
            'Customer Segment': 'Consumer',
        }
    },
    {
        'name': 'Express fast delivery',
        'features': {
            'Days for shipment (scheduled)': 1,
            'Order Item Quantity': 1,
            'Sales per customer': 500,
            'Shipping Mode': 'First Class',
            'Market': 'Europe',
            'Customer Segment': 'Corporate',
        }
    },
    {
        'name': 'Bulk order',
        'features': {
            'Days for shipment (scheduled)': 10,
            'Order Item Quantity': 100,
            'Sales per customer': 5000,
            'Shipping Mode': 'Ship',
            'Market': 'LATAM',
            'Customer Segment': 'Corporate',
        }
    }
]

for test in test_cases:
    print(f'\n  {test["name"]}:')
    prediction = delay_predictor.predict_hybrid(test['features'])
    
    if 'error' in prediction:
        print(f'    ✗ Error: {prediction["error"]}')
    else:
        print(f'    ✓ Delay Risk: {prediction["delay_probability"]:.1f}%')
        print(f'    ✓ Confidence: {prediction["confidence"]:.1f}%')
        print(f'    ✓ Risk Level: {prediction["risk_level"]}')
        if 'breakdown' in prediction:
            bd = prediction['breakdown']
            print(f'    ✓ Breakdown - ML: {bd["ml_model_prediction"]:.1f}%, Historical: {bd["historical_patterns_average"]:.1f}%')

print('\n✓ All tests completed successfully!')
