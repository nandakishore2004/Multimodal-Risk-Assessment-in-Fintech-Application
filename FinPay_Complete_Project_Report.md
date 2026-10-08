# FinPay: Multimodal Risk Assessment in FinTech Application
**Complete Project Report & Implementation Guide**

---

## 1. Project Overview
**FinPay** is a next-generation intelligent financial platform designed to provide a secure digital wallet, instant loan processing, and real-time fraud detection. Unlike traditional FinTech apps that rely on simple rule-based checks, FinPay utilizes a **Multimodal AI Risk Assessment Engine**. This engine combines Vision, Natural Language Processing (NLP), Tabular Data, and Audio analysis to create a comprehensive, 360-degree risk profile of the user and their transactions.

---

## 2. Core Architecture & Tech Stack

### Frontend (User Interface)
* **Framework:** Next.js (React), TypeScript.
* **Styling:** CSS Modules, Vanilla CSS (`globals.css`), and inline dynamic styling.
* **Key Components:** 
  * `AIAssistant.tsx`: An interactive chat interface connecting to the multi-provider AI backend.
  * `NavBar.tsx`, `PinModal.tsx`: Secure navigation and authentication components.
  * Interactive Dashboards for Wallet, Loans, and Risk Analysis.

### Backend (Server & APIs)
* **Framework:** Flask (Python).
* **Entry Point:** `app.py` (Handles routing, AI model inference, and external API calls).
* **Environment Management:** `dotenv` for securely loading API keys (`.env`).
* **Concurrency:** Threaded request handling for non-blocking model execution.

---

## 3. The Multimodal AI Risk Engine (Pin-to-Pin Implementation)
The core uniqueness of FinPay lies in its fusion of four distinct deep learning models, combined via a Cross-Attention Fusion Engine.

### A. ViT-B/16 (KYC Vision Model)
* **Purpose:** KYC Document Tamper Detection.
* **Implementation:** Uses a Vision Transformer (ViT-B/16) to scan uploaded ID cards (like PAN/Aadhaar) to detect forgery, digital alterations, or mismatched photos.
* **Status:** Fully integrated in the backend.

### B. DeBERTa-v3 (NLP Fraud Intent Model)
* **Purpose:** Analyzes transaction descriptions, chat messages, and user input for fraudulent intent.
* **Implementation:** Fine-tuned `microsoft/deberta-v3-base`. It flags suspicious patterns like "urgent money transfer," "lottery," or "account blocked" scams.

### C. FT-Transformer (Tabular Risk Model)
* **Purpose:** Analyzes structured transaction data (amounts, frequency, balances, merchant IDs).
* **Implementation:** Trained on the PaySim dataset. Uses a Feature Tokenizer Transformer (FT-Transformer) and a custom `PaySim scaler v2` to output a numerical risk score (0-100).
* **Risk Thresholds:** <30 = Low Risk (Green), 30-60 = Medium Risk (Yellow), >60 = High Risk (Red).

### D. Telugu Whisper ASR (Voice Risk Analysis)
* **Purpose:** Voice authentication and transcription for rural/regional users.
* **Implementation:** A fine-tuned Whisper-small model specifically for the Telugu language. Transcribes audio and detects fraud keywords spoken during voice-based transactions.

### E. Cross-Attention Fusion
* **Purpose:** Combines the outputs (embeddings) of Vision, NLP, Tabular, and Audio models into a single, unified risk decision. 

---

## 4. AI Chat Assistant (Multi-Provider Fallback System)
The FinPay AI Assistant is highly advanced and robust, designed to assist users with financial literacy, risk scores, and platform navigation in both **English and Tenglish (Telugu-English)**.

### The 3-Tier Fallback Architecture (Implementation Details)
To ensure the AI never goes down due to rate limits or IP blocks, a custom routing system was implemented in `app.py` (`/api/chat` endpoint):

1. **Primary Provider - Google Gemini (`GEMINI_API_KEY`)**
   * Uses `gemini-flash-latest`, `gemini-2.5-flash-lite`, and `gemini-2.5-flash`.
   * Fast and highly accurate. If daily quotas (1,500 requests) are exhausted, it gracefully falls back.
2. **Secondary Provider - Groq (`GROQ_API_KEY`)**
   * Uses `llama-3.1-8b-instant`.
   * Ultra-fast inference. Used if Gemini hits a `429 Quota Exceeded` error.
3. **Tertiary Provider - OpenRouter (`OPENROUTER_API_KEY`)**
   * Uses `openrouter/free` (auto-routes to the best free Llama/Gemma model).
   * Used if Groq faces Cloudflare IP bans or network issues.

### Safety Filter Regex
An advanced regex filter is implemented to strip AI hallucinations (e.g., Llama-3 automatically appending "User Safety: safe") before sending the response to the frontend, ensuring a clean UI.

---

## 5. Security & Configuration
* **Environment Variables (`.env`)**:
  * `ROBOFLOW_API_KEY`
  * `GEMINI_API_KEY`
  * `OPENROUTER_API_KEY`
  * `GROQ_API_KEY`
* **Error Handling:** Graceful API failures preventing `500 Internal Server Errors`. If all AIs fail, the system returns a polite "Demo Mode / Quota Exceeded" message.

---

## 6. What We Did (Summary of Recent Developments)
1. **Resolved Rate Limiting (429):** Fixed a bug where exhausted Gemini limits crashed the server.
2. **Groq Integration & IP Bypass:** Attempted Groq integration, encountered Cloudflare IP blocks (Error 1010), and successfully bypassed this by implementing OpenRouter as a fallback.
3. **Multi-AI System:** Engineered the 3-tier AI fallback mechanism in Python.
4. **UI Refinement:** Updated React components (`AIAssistant.tsx`) to display a dynamic `AI ENGINE` badge instead of hardcoded provider names.
5. **Output Sanitization:** Implemented Regex sanitization for LLM safety hallucinations.

---
*Generated by FinPay System AI.*
