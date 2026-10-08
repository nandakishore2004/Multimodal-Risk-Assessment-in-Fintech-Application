# 🚀 Implementation — Multimodal Risk Assessment FinTech

This folder contains all source code, trained models, and training notebooks for the project.

---

## 📁 Folder Structure

```
implementation/
│
├── app.py                          # Main Flask application (entry point)
├── requirements.txt                # Python dependencies
│
├── backend/                        # FastAPI microservice
│   ├── main.py                     # FastAPI routes & endpoints
│   ├── roboflow_service.py         # KYC document OCR (Roboflow API)
│   └── telegram_service.py        # Telegram alert notifications
│
├── frontend/                       # Next.js Web App (React + TypeScript)
│   └── src/app/
│       ├── login/                  # Login page
│       ├── dashboard/              # Risk dashboard
│       ├── kyc/                    # KYC verification page
│       ├── pay/                    # Payment risk check
│       ├── loan/                   # Loan risk assessment
│       └── voice/                  # Telugu voice authentication
│
├── model/                          # Trained AI models (Git LFS)
│   ├── deberta_model.pt            # DeBERTa NLP model (369 MB)
│   ├── vit_model.pt                # ViT KYC model (343 MB)
│   ├── ft_transformer_model.pt     # FT-Transformer tabular model
│   ├── rf_model.pkl                # Random Forest (credit card)
│   ├── paysim_xgb_v2.pkl          # XGBoost (PaySim fraud)
│   ├── lstm_model.h5               # LSTM sequential model
│   ├── cross_attention_fusion.pt   # Multimodal fusion layer
│   └── telugu_whisper_finetuned/   # Fine-tuned Whisper (967 MB)
│       └── telugu_whisper_small.pt
│
├── static/                         # CSS & JS for Flask frontend
├── templates/                      # HTML templates for Flask
│
├── 📒 Training Notebooks
│   ├── train_deberta_nlp.ipynb     # DeBERTa training
│   ├── train_ft_transformer.ipynb  # FT-Transformer training
│   ├── train_vit_kyc.ipynb         # ViT KYC document training
│   ├── creditcard train.ipynb      # Credit card fraud (RF + XGBoost)
│   ├── payism.ipynb                # PaySim fraud detection
│   └── train_telugu_voice.py       # Telugu Whisper fine-tuning script
│
└── 🛠️ Utility Scripts
    ├── inject_ocr.py
    ├── replace_banks.py
    ├── test_api.py
    ├── test_models.py
    └── update_api_ocr.py
```

---

## ⚙️ How to Run

### Step 1 — Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 2 — Setup Environment Variables

```bash
cp ../.env.example ../.env
# Fill in your API keys in .env
```

### Step 3A — Run Flask Backend

```bash
python app.py
# Runs on http://localhost:5000
```

### Step 3B — Run FastAPI Backend (alternative)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Step 4 — Run Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## 🧠 AI Models Used

| Model | Task | Framework | Size |
|-------|------|-----------|------|
| **DeBERTa** | Transaction NLP risk analysis | PyTorch | 369 MB |
| **ViT** | KYC document image verification | PyTorch | 343 MB |
| **FT-Transformer** | Tabular fraud detection | PyTorch | ~1 MB |
| **Whisper (Telugu)** | Voice authentication | PyTorch | 967 MB |
| **XGBoost** | PaySim fraud detection | Scikit-learn | ~1 MB |
| **Random Forest** | Credit card fraud | Scikit-learn | 16 MB |
| **LSTM** | Sequential transaction patterns | Keras | ~1 MB |
| **Cross-Attention Fusion** | Combine all model outputs | PyTorch | ~13 KB |

---

## 🔗 API Endpoints (Flask)

| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/predict/payment` | Payment fraud risk score |
| `POST` | `/predict/kyc` | KYC document verification |
| `POST` | `/predict/loan` | Loan default risk |
| `POST` | `/predict/voice` | Telugu voice authentication |
| `GET`  | `/health` | Health check |

---

## 🛠️ Tech Stack

- **Backend**: Python, Flask, FastAPI
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **AI/ML**: PyTorch, HuggingFace Transformers, Scikit-learn, XGBoost, Keras
- **APIs**: Roboflow (OCR), Telegram Bot
- **Models**: DeBERTa, ViT, Whisper, FT-Transformer, LSTM
