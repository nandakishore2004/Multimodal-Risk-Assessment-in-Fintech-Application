"""
Multimodal FinTech Risk Assessment — Comprehensive Test Suite
Tests all API endpoints, deep learning model loading, and multimodal risk assessment logic.
Usage:
    python test_api.py
"""

import os
import sys
import json
import unittest

# Ensure working directory is added to sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from app import app, MODEL_DIR, fusion_path, fusion_model


class TestNeoRiskAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        cls.client = app.test_client()
        print("\n" + "=" * 60)
        print("  NeoRisk AI — Backend & Model Integration Test Suite")
        print("=" * 60)

    def test_01_index_page(self):
        """Test GET / renders HTML successfully"""
        res = self.client.get('/')
        self.assertEqual(res.status_code, 200)
        self.assertIn(b'NeoRisk', res.data)
        self.assertIn(b'Multimodal', res.data)
        print("  [PASS] Index Page (GET /) loaded 200 OK")

    def test_02_health_endpoint(self):
        """Test GET /api/health returns model status"""
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data.get('status'), 'ok')
        self.assertIn('models', data)
        self.assertIn('device', data)
        print(f"  [PASS] Health Endpoint: Device={data['device']}, Models={list(data['models'].keys())}")

    def test_03_model_info_endpoint(self):
        """Test GET /api/model_info returns all 5 model details"""
        res = self.client.get('/api/model_info')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        required_models = ['vit', 'deberta', 'ft_transformer', 'whisper', 'fusion']
        for m in required_models:
            self.assertIn(m, data)
            self.assertIn('name', data[m])
            self.assertIn('architecture', data[m])
        print("  [PASS] Model Info Endpoint contains all 5 model specs")

    def test_04_fusion_model_persisted(self):
        """Verify cross_attention_fusion.pt was generated/saved"""
        self.assertTrue(os.path.exists(fusion_path), "cross_attention_fusion.pt should exist")
        size_kb = os.path.getsize(fusion_path) / 1024
        print(f"  [PASS] Fusion Model Weights: {fusion_path} ({size_kb:.1f} KB)")

    def test_05_assess_risk_legit_transaction(self):
        """Test POST /api/assess_risk with normal legitimate payload"""
        payload = {
            "has_image": False,
            "has_voice": False,
            "query_text": "Please provide my quarterly statement balance.",
            "transaction": {
                "step": 1,
                "type": 5,  # PAYMENT
                "amount": 250,
                "oldbalanceOrg": 15000,
                "oldbalanceDest": 5000
            }
        }
        res = self.client.post('/api/assess_risk', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('success'))
        self.assertIn('overall_risk', data)
        self.assertIn('verdict', data)
        self.assertIn('results', data)
        # Should be Low / Medium risk
        self.assertLess(data['overall_risk'], 60)
        print(f"  [PASS] Legit Assessment: Risk={data['overall_risk']}/100 -> {data['verdict']}")

    def test_06_assess_risk_fraud_transaction(self):
        """Test POST /api/assess_risk with high-risk fraud triggers across all modalities"""
        payload = {
            "has_image": True,
            "demo_force_fake_image": True,
            "has_voice": True,
            "demo_force_suspicious_voice": True,
            "query_text": "Urgent! Your account is blocked and frozen. Share OTP immediately!",
            "transaction": {
                "step": 1,
                "type": 4,  # TRANSFER
                "amount": 900000,
                "oldbalanceOrg": 900000,
                "oldbalanceDest": 0
            }
        }
        res = self.client.post('/api/assess_risk', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('success'))
        self.assertGreaterEqual(data['overall_risk'], 60)
        self.assertIn("DENY TRANSACTION", data['verdict'])
        self.assertGreater(len(data.get('risk_factors', [])), 0)
        print(f"  [PASS] Fraud Assessment: Risk={data['overall_risk']}/100 -> {data['verdict']}")
        print(f"         Detected Factors ({len(data['risk_factors'])}): {data['risk_factors'][0]}")

    def test_07_voice_analyze_nlp_fallback(self):
        """Test POST /api/voice_analyze text-based fallback"""
        data = {
            'transcript': 'అర్జెంట్ డబ్బు ట్రాన్స్ఫర్ ఓటీపీ OTP password'
        }
        res = self.client.post('/api/voice_analyze', data=data)
        self.assertEqual(res.status_code, 200)
        json_data = res.get_json()
        self.assertTrue(json_data.get('success'))
        self.assertGreater(json_data['fraud_prob'], 0.5)
        print(f"  [PASS] Voice Analyze Telugu Keywords: Prob={json_data['fraud_prob']} ({json_data['prediction']})")


    def test_08_wallet_endpoint(self):
        """Test GET /api/wallet returns user account and balance"""
        res = self.client.get('/api/wallet')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('success'))
        self.assertIn('balance', data['wallet'])
        print(f"  [PASS] Wallet Endpoint: Balance=Rs.{data['wallet']['balance']}, User={data['wallet']['user_name']}")

    def test_09_real_world_payment_approved(self):
        """Test POST /api/pay with normal legitimate consumer payment"""
        payload = {
            "recipient_id": "ananya@okhdfcbank",
            "recipient_name": "Ananya Verma",
            "amount": 1200,
            "note": "Dinner bill split from yesterday"
        }
        res = self.client.post('/api/pay', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('success'))
        self.assertEqual(data.get('status'), 'APPROVED')
        self.assertIn('tx_id', data)
        print(f"  [PASS] Consumer Pay Approved: Tx={data['tx_id']} -> Status={data['status']}, NewBalance=Rs.{data['new_balance']}")

    def test_10_real_world_payment_blocked(self):
        """Test POST /api/pay with high-risk scammer recipient and phishing note"""
        from app import USER_WALLET
        USER_WALLET['balance'] = 50000.0 # Reset balance for test isolation

        payload = {
            "recipient_id": "lottery_claim_99@upi",
            "recipient_name": "KBC Lottery Support",
            "amount": 45000,
            "note": "Urgent! Account blocked, transfer OTP immediately to avoid freeze.",
            "has_image": True,
            "demo_force_fake_image": True,
            "has_voice": True,
            "demo_force_suspicious_voice": True
        }
        res = self.client.post('/api/pay', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertFalse(data.get('success'))
        self.assertEqual(data.get('status'), 'BLOCKED')
        self.assertGreaterEqual(data.get('overall_risk'), 60)
        print(f"  [PASS] Consumer Pay Blocked: Status={data['status']}, Risk={data['overall_risk']}/100, Title='{data['title']}'")




if __name__ == '__main__':
    unittest.main(verbosity=2)

