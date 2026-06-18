import pandas as pd
import os

# Load the dataset
data_path = r"c:\Users\vaish\OneDrive\Desktop\supply chain\data\DataCoSupplyChainDataset.csv"
df = pd.read_csv(data_path, encoding='latin-1')

print(f"Dataset shape: {df.shape}")
print(f"\n{'='*80}")
print(f"Columns ({len(df.columns)}):")
for i, col in enumerate(df.columns, 1):
    print(f"{i:2d}. {col}")

print(f"\n{'='*80}")
print(f"\nData types:\n{df.dtypes}\n")

print(f"{'='*80}")
print(f"\nMissing values (showing non-zero):")
missing = df.isnull().sum()
print(missing[missing > 0])

print(f"\n{'='*80}")
print(f"\nBasic Statistics:")
print(df.describe())

print(f"\n{'='*80}")
print(f"\nSample rows (first 3):")
print(df.head(3))
