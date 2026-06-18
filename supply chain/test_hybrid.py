#!/usr/bin/env python
import sys
sys.path.insert(0, 'backend')

from models.data_loader import DataLoader
from models.delay_predictor import DelayPredictor

print('Step 1: Loading data...')
dl = DataLoader(data_dir='data')
df = dl.load_dataset('DataCoSupplyChainDataset.csv')
print(f'✓ Loaded {len(df)} records')

print('\nStep 2: Preprocessing...')
dl.preprocess_for_delay_prediction()
print(f'✓ Preprocessed data')
print(f'  Processed DF shape: {dl.processed_df.shape}')

print('\nStep 3: Checking is_delayed column...')
if 'is_delayed' in dl.processed_df.columns:
    print(f'✓ is_delayed column exists')
    delay_rate = dl.processed_df['is_delayed'].mean() * 100
    print(f'  Delay rate: {delay_rate:.1f}%')
else:
    print('✗ is_delayed column NOT found')
    print(f'  Available columns: {list(dl.processed_df.columns[:10])}')
    sys.exit(1)

print('\nStep 4: Training model...')
delay_predictor = DelayPredictor()
result = delay_predictor.train_from_data(dl)
print(f'✓ Training completed')
print(f'  Is trained: {delay_predictor.is_trained}')
print(f'  Feature columns: {len(delay_predictor.feature_columns)}')

print('\nStep 5: Testing hybrid prediction...')
test_features = {
    'Days for shipment (scheduled)': 3,
    'Order Item Quantity': 5,
    'Sales per customer': 200,
    'Shipping Mode': 'Standard Class',
    'Market': 'USCA',
    'Customer Segment': 'Consumer',
}

prediction = delay_predictor.predict_hybrid(test_features)
if 'error' in prediction:
    print(f'✗ Error: {prediction["error"]}')
else:
    print(f'✓ Prediction successful!')
    print(f'  Delay Risk: {prediction["delay_probability"]:.1f}%')
    print(f'  Confidence: {prediction["confidence"]:.1f}%')
    print(f'  Risk Level: {prediction["risk_level"]}')
