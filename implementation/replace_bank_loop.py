"""Replace bank eligibility loop using index-based slicing (handles any line endings)."""

with open('app.py', encoding='utf-8') as f:
    content = f.read()

start = content.find('        offers, bank_rules = [], []')
end = content.find('        return jsonify({', start)

if start == -1 or end == -1:
    print("ERROR: could not locate block")
    exit(1)

NEW_BLOCK = """        offers, bank_rules = [], []
        has_kyc = bool(data.get('has_kyc'))
        for partner in LOAN_PARTNERS:
            reasons_fail = []

            # Per-bank eligibility checks using real bank rules
            if credit_score < partner['min_credit_score']:
                reasons_fail.append(
                    f"Credit score {credit_score} is below this bank's minimum of {partner['min_credit_score']}."
                )
            if monthly_income < partner['min_income']:
                reasons_fail.append(
                    f"Monthly income Rs.{monthly_income:,.0f} is below this bank's minimum of Rs.{partner['min_income']:,.0f}."
                )
            if dti_ratio > partner['max_dti']:
                reasons_fail.append(
                    f"EMI burden {dti_ratio*100:.1f}% exceeds this bank's max DTI of {partner['max_dti']*100:.0f}%."
                )
            if employment_years < partner['min_employment_years']:
                reasons_fail.append(
                    f"Employment {employment_years:.1f} yrs is below this bank's minimum of {partner['min_employment_years']} yrs."
                )
            if missed_emis > partner['max_missed_emis']:
                reasons_fail.append(
                    f"{missed_emis} missed EMIs exceed this bank's allowed maximum of {partner['max_missed_emis']}."
                )
            if loan_amount > partner['max_amount']:
                reasons_fail.append(
                    f"Requested amount Rs.{loan_amount:,.0f} exceeds this bank's cap of Rs.{partner['max_amount']:,.0f}."
                )
            if partner['kyc_required'] and not has_kyc:
                reasons_fail.append('This bank requires verified KYC (Aadhaar/PAN).')
            if decision_code == 'declined':
                reasons_fail.append('Overall AI risk score is too high for this product.')

            eligible = len(reasons_fail) == 0
            if not reasons_fail:
                reasons_fail.append('Profile meets all eligibility criteria for this product.')

            # Rate: base + credit score adjustment + DTI surcharge
            if credit_score >= 750:
                credit_adj = 0.0
            elif credit_score >= 720:
                credit_adj = 0.5
            elif credit_score >= 700:
                credit_adj = 1.0
            elif credit_score >= 650:
                credit_adj = 2.0
            else:
                credit_adj = 3.0
            dti_adj = 0.75 if dti_ratio > 0.45 else 0.0
            rate = partner['base_rate'] + credit_adj + dti_adj

            # Approved amount: min of (requested, bank cap, income multiplier)
            income_mult = 20 if credit_score >= 750 else (15 if credit_score >= 700 else 10)
            approved_amount = min(loan_amount, partner['max_amount'], monthly_income * income_mult)

            bank_rules.append({
                'bank': partner['bank'],
                'rules': partner['rule_text'],
                'eligible': eligible,
                'reasons': reasons_fail,
            })
            if eligible:
                offers.append({
                    'bank': partner['bank'],
                    'product': partner['product'],
                    'interest_rate': round(rate, 2),
                    'approved_amount': round(approved_amount),
                    'estimated_emi': round(_loan_emi(approved_amount, rate, tenure_months)),
                    'tenure_months': tenure_months,
                    'why_recommended': (
                        f"{partner['bank']} offers {rate:.2f}% p.a. — credit score {credit_score}, "
                        f"DTI {dti_ratio*100:.1f}%. Approved up to Rs.{approved_amount:,.0f}."
                    )
                })
        # Sort by lowest interest rate first
        offers.sort(key=lambda x: x['interest_rate'])

"""

new_content = content[:start] + NEW_BLOCK + content[end:]
with open('app.py', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("SUCCESS: per-bank eligibility loop updated")
print(f"Replaced {end-start} chars at offset {start}")
