# 🏦 Multimodal Risk Assessment in FinTech Application

A comprehensive AI-powered fintech risk assessment system that combines multiple AI models for fraud detection, KYC verification, voice authentication, and loan risk analysis.

---

## 🧠 AI Models Used

| Model | Purpose | Framework |
|-------|---------|-----------|
| **DeBERTa** | NLP-based transaction risk analysis | PyTorch |
| **FT-Transformer** | Tabular fraud detection | PyTorch |
| **ViT (Vision Transformer)** | KYC document verification | PyTorch |
| **XGBoost** | PaySim fraud detection | Scikit-learn |
| **Whisper (Fine-tuned)** | Telugu voice authentication | PyTorch |
| **Random Forest** | Credit card fraud detection | Scikit-learn |
| **LSTM** | Sequential transaction analysis | TensorFlow/Keras |
| **Cross-Attention Fusion** | Multimodal risk fusion layer | PyTorch |

---

## 📁 Project Structure

```
├── app.py                          # Main Flask backend
├── backend/
│   ├── main.py                     # FastAPI backend
│   ├── roboflow_service.py         # KYC document OCR service
│   └── telegram_service.py        # Alert notifications
├── frontend/                       # Next.js frontend
│   └── src/app/
│       ├── dashboard/             # Risk dashboard
│       ├── kyc/                   # KYC verification
│       ├── pay/                   # Payment risk check
│       ├── loan/                  # Loan risk assessment
│       └── voice/                 # Voice authentication
├── model/                          # Trained model files (Git LFS)
│   ├── deberta_model.pt
│   ├── vit_model.pt
│   ├── ft_transformer_model.pt
│   ├── rf_model.pkl
│   ├── paysim_xgb_v2.pkl
│   ├── lstm_model.h5
│   └── telugu_whisper_finetuned/
├── train_deberta_nlp.ipynb         # DeBERTa training notebook
├── train_ft_transformer.ipynb      # FT-Transformer training
├── train_vit_kyc.ipynb             # ViT KYC training
├── creditcard train.ipynb          # Credit card fraud training
└── payism.ipynb                    # PaySim fraud training
```

---

## 📦 Datasets (Download Required)

> ⚠️ Datasets are too large for GitHub. Download them manually and place in `DATASETS MAJOR PROJECT/` folder.

| Dataset | Description | Download |
|---------|------------|---------|
| **PaySim Dataset** | Synthetic mobile money transactions | [Kaggle - PaySim](https://www.kaggle.com/datasets/ealaxi/paysim1) |
| **Credit Card Fraud** | European credit card transactions | [Kaggle - Credit Card Fraud Detection](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) |
| **KYC Aadhaar Cards** | Indian ID document images | [Roboflow - Back Aadhaar Card](https://universe.roboflow.com/surya-5hkys/back-aadhaar-card) |
| **Telugu Voice Corpus** | Mozilla Common Voice - Telugu | [Mozilla Common Voice](https://commonvoice.mozilla.org/en/datasets) |
| **GPTeacher Telugu** | Telugu romanized NLP dataset | Internal dataset (contact repo owner) |

---

## 🚀 Setup & Installation

### Backend (Flask)
```bash
pip install -r requirements.txt
python app.py
```

### FastAPI Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

---

## 🔬 Training Notebooks

| Notebook | Model | Dataset |
|----------|-------|---------|
| `train_deberta_nlp.ipynb` | DeBERTa NLP Model | GPTeacher Telugu |
| `train_ft_transformer.ipynb` | FT-Transformer | PaySim |
| `train_vit_kyc.ipynb` | ViT Document Model | Aadhaar Cards |
| `creditcard train.ipynb` | Random Forest + XGBoost | Credit Card Fraud |
| `payism.ipynb` | PaySim Fraud Detection | PaySim Dataset |

---

## 🏗️ Architecture

![Flow Diagram](Flow%20Diagram%20for%20Multimodal%20Risk%20Assessment%20in%20FinTech%20Applications%20Updated.png)

---

## 👥 Team

**Major Project - B.Tech Final Year**  
Multimodal Risk Assessment in FinTech Applications
