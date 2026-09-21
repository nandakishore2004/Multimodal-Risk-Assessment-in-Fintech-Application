import re

with open('app.py', encoding='utf-8') as f:
    content = f.read()

NEW_BANKS = '''LOAN_PARTNERS = [
    {
        'bank': 'State Bank of India', 'product': 'SBI Personal Loan (YONO)',
        'base_rate': 10.30, 'max_amount': 2000000,
        'min_credit_score': 650, 'min_income': 15000, 'max_dti': 0.55,
        'min_employment_years': 1.0, 'max_missed_emis': 2, 'kyc_required': True,
        'rule_text': [
            'Min credit score 650 (750+ for best rate)',
            'Min monthly income Rs.15,000',
            'Loan up to Rs.20 Lakh',
            'EMI burden <= 55% of monthly income',
            'Min 1 year employment history',
            'KYC (Aadhaar/PAN) mandatory',
            'Max 2 missed EMIs in last 12 months',
        ]
    },
    {
        'bank': 'HDFC Bank', 'product': 'HDFC Xpress Personal Loan',
        'base_rate': 10.50, 'max_amount': 4000000,
        'min_credit_score': 700, 'min_income': 25000, 'max_dti': 0.50,
        'min_employment_years': 2.0, 'max_missed_emis': 1, 'kyc_required': True,
        'rule_text': [
            'Min credit score 700 (750+ for lowest rate)',
            'Min monthly income Rs.25,000',
            'Loan up to Rs.40 Lakh',
            'EMI burden <= 50% of monthly income',
            'Min 2 years employment history',
            'Video KYC / Aadhaar eKYC mandatory',
            'Max 1 missed EMI in last 12 months',
        ]
    },
    {
        'bank': 'ICICI Bank', 'product': 'ICICI Instant Personal Loan',
        'base_rate': 10.65, 'max_amount': 5000000,
        'min_credit_score': 700, 'min_income': 30000, 'max_dti': 0.50,
        'min_employment_years': 2.0, 'max_missed_emis': 1, 'kyc_required': True,
        'rule_text': [
            'Min credit score 700',
            'Min monthly income Rs.30,000',
            'Loan up to Rs.50 Lakh',
            'EMI burden <= 50% of monthly income',
            'Min 2 years employment history',
            'Aadhaar + PAN eKYC mandatory',
            'Max 1 missed EMI in last 12 months',
        ]
    },
    {
        'bank': 'Axis Bank', 'product': 'Axis Bank Personal Loan',
        'base_rate': 10.49, 'max_amount': 4000000,
        'min_credit_score': 700, 'min_income': 15000, 'max_dti': 0.50,
        'min_employment_years': 1.0, 'max_missed_emis': 2, 'kyc_required': True,
        'rule_text': [
            'Min credit score 700',
            'Min monthly income Rs.15,000',
            'Loan up to Rs.40 Lakh',
            'EMI burden <= 50% of monthly income',
            'Min 1 year employment history',
            'Aadhaar OTP eKYC mandatory',
            'Max 2 missed EMIs in last 12 months',
        ]
    },
    {
        'bank': 'Kotak Mahindra Bank', 'product': 'Kotak Personal Loan',
        'base_rate': 10.99, 'max_amount': 4000000,
        'min_credit_score': 720, 'min_income': 20000, 'max_dti': 0.50,
        'min_employment_years': 1.0, 'max_missed_emis': 1, 'kyc_required': True,
        'rule_text': [
            'Min credit score 720',
            'Min monthly income Rs.20,000',
            'Loan up to Rs.40 Lakh',
            'EMI burden <= 50% of monthly income',
            'Min 1 year employment history',
            'Full KYC (Aadhaar + PAN) required',
            'Max 1 missed EMI in last 12 months',
        ]
    },
    {
        'bank': 'Punjab National Bank', 'product': 'PNB Personal Loan',
        'base_rate': 10.40, 'max_amount': 1500000,
        'min_credit_score': 650, 'min_income': 12000, 'max_dti': 0.60,
        'min_employment_years': 0.5, 'max_missed_emis': 3, 'kyc_required': True,
        'rule_text': [
            'Min credit score 650',
            'Min monthly income Rs.12,000',
            'Loan up to Rs.15 Lakh',
            'EMI burden <= 60% of monthly income',
            'Min 6 months employment',
            'Aadhaar / Govt ID KYC mandatory',
            'Max 3 missed EMIs in last 12 months',
        ]
    },
    {
        'bank': 'Bank of Baroda', 'product': 'BOB Personal Loan',
        'base_rate': 10.35, 'max_amount': 1000000,
        'min_credit_score': 650, 'min_income': 10000, 'max_dti': 0.55,
        'min_employment_years': 0.5, 'max_missed_emis': 3, 'kyc_required': True,
        'rule_text': [
            'Min credit score 650',
            'Min monthly income Rs.10,000',
            'Loan up to Rs.10 Lakh',
            'EMI burden <= 55% of monthly income',
            'Min 6 months employment',
            'KYC (Aadhaar) mandatory',
            'Max 3 missed EMIs in last 12 months',
        ]
    },
    {
        'bank': 'IndusInd Bank', 'product': 'IndusInd Instant Personal Loan',
        'base_rate': 10.49, 'max_amount': 5000000,
        'min_credit_score': 720, 'min_income': 25000, 'max_dti': 0.50,
        'min_employment_years': 2.0, 'max_missed_emis': 1, 'kyc_required': True,
        'rule_text': [
            'Min credit score 720',
            'Min monthly income Rs.25,000',
            'Loan up to Rs.50 Lakh',
            'EMI burden <= 50% of monthly income',
            'Min 2 years employment history',
            'Video KYC / Aadhaar eKYC required',
            'Max 1 missed EMI in last 12 months',
        ]
    },
    {
        'bank': 'Yes Bank', 'product': 'YES FIRST Personal Loan',
        'base_rate': 10.99, 'max_amount': 4000000,
        'min_credit_score': 700, 'min_income': 20000, 'max_dti': 0.50,
        'min_employment_years': 1.0, 'max_missed_emis': 2, 'kyc_required': True,
        'rule_text': [
            'Min credit score 700',
            'Min monthly income Rs.20,000',
            'Loan up to Rs.40 Lakh',
            'EMI burden <= 50% of monthly income',
            'Min 1 year employment history',
            'eKYC with Aadhaar OTP mandatory',
            'Max 2 missed EMIs in last 12 months',
        ]
    },
    {
        'bank': 'Union Bank of India', 'product': 'Union Personal Loan',
        'base_rate': 10.50, 'max_amount': 1500000,
        'min_credit_score': 600, 'min_income': 10000, 'max_dti': 0.60,
        'min_employment_years': 0.5, 'max_missed_emis': 3, 'kyc_required': True,
        'rule_text': [
            'Min credit score 600 (most flexible)',
            'Min monthly income Rs.10,000',
            'Loan up to Rs.15 Lakh',
            'EMI burden <= 60% of monthly income',
            'Min 6 months employment',
            'Aadhaar / Voter ID KYC required',
            'Max 3 missed EMIs (case-by-case review)',
        ]
    },
]'''

# Replace old LOAN_PARTNERS block
pattern = r"LOAN_PARTNERS = \[.*?\]"
new_content = re.sub(pattern, NEW_BANKS, content, count=1, flags=re.DOTALL)

if new_content == content:
    print("ERROR: pattern not matched")
else:
    with open('app.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS: LOAN_PARTNERS updated with 10 banks")
