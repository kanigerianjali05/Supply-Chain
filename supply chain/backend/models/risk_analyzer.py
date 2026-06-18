import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
import warnings
warnings.filterwarnings('ignore')

class RiskAnalyzer:
    """ML Model for supplier risk analysis"""
    
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.risk_thresholds = {
            'high': 0.7,
            'medium': 0.4,
            'low': 0.0
        }
    
    def analyze(self, supplier_data):
        """Analyze supplier risk based on multiple factors"""
        try:
            results = []
            
            for supplier in supplier_data:
                # Calculate risk score based on multiple factors
                on_time_risk = 1 - supplier['on_time_rate']
                quality_risk = 1 - supplier['quality_score']
                cost_risk = supplier['cost_index'] * 0.3  # Cost variance risk
                defect_risk = supplier['defect_rate']
                
                # Weighted risk calculation
                overall_risk = (
                    on_time_risk * 0.35 +
                    quality_risk * 0.30 +
                    cost_risk * 0.20 +
                    defect_risk * 0.15
                )
                
                # Determine risk level
                if overall_risk >= self.risk_thresholds['high']:
                    risk_level = 'High'
                    color = '#FF6B6B'
                elif overall_risk >= self.risk_thresholds['medium']:
                    risk_level = 'Moderate'
                    color = '#FFA500'
                else:
                    risk_level = 'Low'
                    color = '#4CAF50'
                
                results.append({
                    'name': supplier['name'],
                    'risk_score': round(overall_risk * 100, 2),
                    'risk_level': risk_level,
                    'color': color,
                    'on_time_rate': supplier['on_time_rate'] * 100,
                    'quality_score': supplier['quality_score'] * 100,
                    'defect_rate': supplier['defect_rate'] * 100,
                    'factors': {
                        'on_time_reliability': round(supplier['on_time_rate'] * 100, 1),
                        'quality_compliance': round(supplier['quality_score'] * 100, 1),
                        'cost_index': round(supplier['cost_index'] * 100, 1),
                        'defect_rate': round(supplier['defect_rate'] * 100, 1)
                    }
                })
            
            # Sort by risk score
            results.sort(key=lambda x: x['risk_score'], reverse=True)
            
            return results
        except Exception as e:
            return {'error': str(e)}
    
    def get_recommendations(self, supplier_risks):
        """Generate risk mitigation recommendations"""
        recommendations = {
            'high_risk': [
                'Develop contingency plans',
                'Increase safety stock',
                'Schedule quality audits',
                'Negotiate contract terms'
            ],
            'medium_risk': [
                'Monitor performance closely',
                'Implement improvement plan',
                'Increase audit frequency'
            ],
            'low_risk': [
                'Continue regular monitoring',
                'Maintain good relationship',
                'Plan for expansion'
            ]
        }
        
        return recommendations
