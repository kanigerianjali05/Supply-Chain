import pandas as pd
import numpy as np
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

class DataLoader:
    """Load and preprocess supply chain historical data"""
    
    def __init__(self, data_dir='../data'):
        self.data_dir = Path(data_dir)
        self.df = None
        self.processed_df = None
    
    def load_dataset(self, filename='DataCoSupplyChainDataset.csv'):
        """Load the main supply chain dataset"""
        try:
            filepath = self.data_dir / filename
            # Try multiple encodings due to potential encoding issues
            try:
                self.df = pd.read_csv(filepath, encoding='utf-8')
            except UnicodeDecodeError:
                self.df = pd.read_csv(filepath, encoding='latin-1')
            
            print(f"✓ Loaded {len(self.df)} records from {filename}")
            print(f"✓ Columns: {len(self.df.columns)}")
            return self.df
        except Exception as e:
            print(f"✗ Error loading dataset: {e}")
            return None
    
    def preprocess_for_delay_prediction(self):
        """Preprocess data for delay prediction model"""
        if self.df is None:
            return None
        
        df = self.df.copy()
        
        # Convert date columns
        df['order date (DateOrders)'] = pd.to_datetime(
            df['order date (DateOrders)'], 
            errors='coerce'
        )
        df['shipping date (DateOrders)'] = pd.to_datetime(
            df['shipping date (DateOrders)'], 
            errors='coerce'
        )
        
        # Calculate actual shipping duration
        df['actual_shipping_days'] = (
            df['shipping date (DateOrders)'] - df['order date (DateOrders)']
        ).dt.days
        
        # Feature engineering
        df['days_delay'] = df['Days for shipping (real)'] - df['Days for shipment (scheduled)']
        df['is_delayed'] = (df['days_delay'] > 0).astype(int)
        df['delay_risk_binary'] = df['Late_delivery_risk']
        
        # Extract time-based features
        df['order_day_of_week'] = df['order date (DateOrders)'].dt.dayofweek
        df['order_month'] = df['order date (DateOrders)'].dt.month
        df['order_quarter'] = df['order date (DateOrders)'].dt.quarter
        
        # Encode categorical features
        df['shipping_mode_encoded'] = pd.factorize(df['Shipping Mode'])[0]
        df['delivery_status_encoded'] = pd.factorize(df['Delivery Status'])[0]
        df['order_status_encoded'] = pd.factorize(df['Order Status'])[0]
        df['customer_segment_encoded'] = pd.factorize(df['Customer Segment'])[0]
        
        # Remove rows with missing critical values
        df = df.dropna(subset=[
            'Days for shipping (real)',
            'Days for shipment (scheduled)',
            'order date (DateOrders)',
            'Shipping Mode'
        ])
        
        self.processed_df = df
        return df
    
    def get_delay_prediction_features(self):
        """Extract features and target for delay prediction"""
        if self.processed_df is None:
            self.preprocess_for_delay_prediction()
        
        feature_cols = [
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
        
        # Filter valid rows
        valid_rows = self.processed_df[feature_cols].notna().all(axis=1)
        X = self.processed_df[valid_rows][feature_cols].values
        y = self.processed_df[valid_rows]['is_delayed'].values
        
        return X, y, feature_cols
    
    def get_statistics(self):
        """Get key statistics from the dataset"""
        if self.df is None:
            return None
        
        stats = {
            'total_records': len(self.df),
            'total_orders': self.df['Order Id'].nunique(),
            'unique_customers': self.df['Customer Id'].nunique(),
            'unique_suppliers': self.df['Product Card Id'].nunique(),
            'late_delivery_rate': (self.df['Late_delivery_risk'] == 1).sum() / len(self.df),
            'avg_shipping_days_real': self.df['Days for shipping (real)'].mean(),
            'avg_shipping_days_scheduled': self.df['Days for shipment (scheduled)'].mean(),
            'total_sales': self.df['Sales'].sum(),
            'avg_order_value': self.df['Sales'].mean(),
            'delivery_statuses': self.df['Delivery Status'].value_counts().to_dict(),
            'shipping_modes': self.df['Shipping Mode'].value_counts().to_dict(),
            'top_markets': self.df['Market'].value_counts().head(5).to_dict(),
            'top_categories': self.df['Category Name'].value_counts().head(5).to_dict()
        }
        
        return stats
    
    def get_delay_analysis(self):
        """Analyze delay patterns in the data"""
        if self.processed_df is None:
            self.preprocess_for_delay_prediction()
        
        df = self.processed_df
        
        analysis = {
            'total_delayed_orders': (df['is_delayed'] == 1).sum(),
            'on_time_orders': (df['is_delayed'] == 0).sum(),
            'delay_percentage': (df['is_delayed'] == 1).sum() / len(df) * 100,
            'avg_delay_days': df['days_delay'].mean(),
            'max_delay_days': df['days_delay'].max(),
            'delays_by_shipping_mode': df[df['is_delayed'] == 1].groupby('Shipping Mode').size().to_dict(),
            'delays_by_market': df[df['is_delayed'] == 1].groupby('Market').size().to_dict(),
            'delays_by_delivery_status': df[df['is_delayed'] == 1].groupby('Delivery Status').size().to_dict()
        }
        
        return analysis
    
    def get_customer_segments_analysis(self):
        """Analyze customer segments and their characteristics"""
        if self.df is None:
            return None
        
        segments = {}
        for segment in self.df['Customer Segment'].unique():
            segment_data = self.df[self.df['Customer Segment'] == segment]
            segments[segment] = {
                'count': len(segment_data),
                'avg_order_value': segment_data['Sales'].mean(),
                'late_delivery_rate': (segment_data['Late_delivery_risk'] == 1).sum() / len(segment_data),
                'top_product': segment_data['Product Name'].value_counts().index[0] if len(segment_data) > 0 else None
            }
        
        return segments
    
    def export_training_data(self, output_file='training_data.csv'):
        """Export preprocessed data for training"""
        if self.processed_df is None:
            self.preprocess_for_delay_prediction()
        
        export_cols = [
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
            'Order Item Profit Ratio',
            'is_delayed',
            'delay_risk_binary'
        ]
        
        export_df = self.processed_df[export_cols].dropna()
        output_path = self.data_dir / output_file
        export_df.to_csv(output_path, index=False)
        print(f"✓ Exported {len(export_df)} records to {output_file}")
        
        return str(output_path)
