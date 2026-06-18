# Sample Supply Chain Data

This directory contains sample historical data for testing and demonstration purposes.

## Files

### sample_demand_history.csv
Historical demand data with the following columns:
- `date`: YYYY-MM-DD format
- `demand`: Daily demand units
- `temperature`: Ambient temperature (°C)
- `season`: Season indicator (monsoon, normal, peak)

### sample_suppliers.csv
Supplier performance data with columns:
- `supplier_name`: Name of the supplier
- `on_time_rate`: On-time delivery rate (0-1)
- `quality_score`: Product quality score (0-1)
- `cost_index`: Cost index for comparison (0-1)
- `defect_rate`: Defect rate (0-1)

### sample_routes.json
Route information with:
- `id`: Route identifier
- `origin`: Starting location (city name and coordinates)
- `destination`: Ending location
- `distance`: Route distance in km
- `estimated_time`: Expected delivery time in hours

## Upload to System

1. Use the data upload endpoint:
```bash
curl -X POST -F "file=@sample_demand_history.csv" \
  -F "type=historical" \
  http://localhost:5000/api/upload-data
```

2. Or through the frontend UI:
   - Navigate to Data Management section
   - Click "Upload Data"
   - Select CSV/JSON file
   - Specify data type

## Data Generation

For production use, generate realistic data based on your business:

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Generate demand data
dates = pd.date_range(end=datetime.now(), periods=90, freq='D')
demand_data = pd.DataFrame({
    'date': dates,
    'demand': np.random.randint(2000, 3500, size=len(dates)),
    'temperature': np.random.uniform(20, 35, size=len(dates)),
    'season': ['monsoon' if d.month in [6,7,8,9] else 'normal' for d in dates]
})

demand_data.to_csv('sample_demand_history.csv', index=False)
```

## Data Format Specifications

### CSV Requirements
- UTF-8 encoding
- Comma-separated values
- Header row with column names
- Consistent data types per column

### JSON Requirements
- Valid JSON format
- Array of objects format
- Consistent schema across records

## Data Privacy

Sample data contains synthetic values for demonstration. Do not use real customer or supplier data without proper anonymization.
