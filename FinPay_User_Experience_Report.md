# FinPay: User Experience & Application Flow
**Complete Frontend User Journey (What the User Sees & Does)**

---

## 1. The Main Dashboard (FinPay Hub)
When a user logs into FinPay, they are greeted with a highly modern, glassmorphism-styled dashboard that acts as the central hub for all their financial activities.

### 💳 FinPay Digital Wallet
**What the user sees:**
* A sleek debit-card style UI containing their Account Number (partially masked) and UPI ID.
* A "Check Balance" button.
* "Send Money" and "Apply Loan" action buttons.

**What the user can do:**
* **Check Balance:** When the user clicks "Check Balance", a secure **PIN Modal** pops up. The user must enter their 4-digit secure PIN. Once authenticated, their real-time wallet balance (e.g., ₹45,200) is revealed instantly.

### 🟢 AI Credit Risk Assessment
**What the user sees:**
* A dynamic circular gauge (Risk Meter) indicating their current Risk Score (e.g., 13/100).
* Color-coded trust levels (Green for Low Risk, Yellow for Medium, Red for High Risk).
* Their traditional Credit Score and their pre-approved "Instant Loan Limit" (e.g., Up to ₹5,00,000).

**What the user can do:**
* **Apply Loan:** By clicking "Apply Loan", the AI evaluates their Risk Score. Because the score is low (e.g., 13), the system instantly flashes a "High Trust" badge and approves the loan automatically without manual paperwork.

---

## 2. FinPay AI Assistant (Interactive Chat)
**What the user sees:**
* A floating, modern chat widget on the bottom right corner of the screen with a badge indicating the active AI Engine.

**What the user can do:**
* **Ask Financial Queries:** The user can type questions in English or **Telugu (Tenglish)** like *"Na risk score entha?"* or *"How much loan can I get?"*
* **Context-Aware Replies:** The AI instantly reads the user's dashboard data and replies accurately (e.g., *"Your risk score is 13%, which is very safe! You are eligible for a 5 Lakh loan."*).
* **24/7 Support:** The AI acts as a personal financial advisor, explaining complex banking terms or providing fraud awareness tips.

---

## 3. FinPay Modules (Advanced AI Features)
At the bottom of the dashboard, the user sees interactive feature cards that showcase the power of FinPay's multimodal AI.

### 📄 KYC Tamper Detection (Computer Vision)
* **What the user sees:** A module to verify their identity.
* **What the user can do:** The user uploads a photo of their Aadhaar or PAN card. The AI (ViT-B/16) instantly scans the document. If it's a real card, it gets verified. If the user uploads a photoshopped or fake ID, the system immediately flags it as "Tampered" and rejects the KYC.

### 💸 Instant Pay & Transfer (Tabular AI)
* **What the user sees:** A secure portal for UPI and QR transactions.
* **What the user can do:** The user initiates a money transfer. In the background, the AI (FT-Transformer) analyzes the transaction amount and frequency. If the transaction seems suspicious (e.g., a sudden huge transfer to an unknown account), the app temporarily blocks it and warns the user.

### 🎙️ Voice Risk Analysis (Audio AI)
* **What the user sees:** A voice-assisted payment feature.
* **What the user can do:** The user can speak to the app (e.g., *"Send 10,000 rupees to Kishore"* in Telugu). The AI (Whisper) not only converts this voice to text to initiate the payment but also detects if the user sounds stressed or if they used forced "scammer" keywords, protecting them from voice-based fraud.

---
*This document outlines the complete practical usability of the FinPay platform from an end-user's perspective.*
