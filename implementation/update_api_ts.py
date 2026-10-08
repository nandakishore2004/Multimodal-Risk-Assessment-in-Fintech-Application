"""Add BankRule interface and bank_rules field to api.ts"""
content = open('frontend/src/lib/api.ts', encoding='utf-8').read()

# Add BankRule interface before LoanResponse
bank_rule_iface = """export interface BankRule {
  bank: string;
  rules: string[];
  eligible: boolean;
  reasons: string[];
}

"""
content = content.replace('export interface LoanResponse {', bank_rule_iface + 'export interface LoanResponse {')

# Add bank_rules field to LoanResponse (after bank_recommendations)
content = content.replace(
    '  bank_recommendations: LoanOffer[];\n  disclaimer: string;',
    '  bank_recommendations: LoanOffer[];\n  bank_rules: BankRule[];\n  disclaimer: string;'
)

open('frontend/src/lib/api.ts', 'w', encoding='utf-8').write(content)
print('SUCCESS: api.ts updated')
