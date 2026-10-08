# 🏦 Multimodal Risk Assessment in FinTech Application

An AI-powered fintech risk assessment system combining multiple deep learning models for real-time fraud detection, KYC verification, voice authentication, and loan risk analysis.

---

## 📁 Repository Structure

```
📦 Multimodal-Risk-Assessment-in-Fintech-Application/
│
├── 📂 implementation/          # All source code + trained models
│   ├── app.py                  # Flask backend (main entry point)
│   ├── backend/                # FastAPI microservice
│   ├── frontend/               # Next.js web application
│   ├── model/                  # Trained AI model files
│   ├── train_*.ipynb           # Training notebooks
│   └── README.md               # ← How to run & setup guide
│
├── 📂 datasets/                # Dataset info + download links
│   └── README.md               # ← Download instructions for all datasets
│
├── 📂 docs/                    # Reports, presentations, diagrams
│   ├── *.pdf / *.docx / *.pptx
│   └── README.md               # ← Index of all documents
│
├── .env.example                # Environment variables template
├── .gitattributes              # Git LFS config (for large model files)
└── README.md                   # ← You are here
```

> 📖 **See each folder's README for details:**
> - [`implementation/README.md`](implementation/README.md) — Setup, run instructions, API docs
> - [`datasets/README.md`](datasets/README.md) — Download links for all datasets
> - [`docs/README.md`](docs/README.md) — Project reports & presentations

---

## 🧠 AI Models at a Glance

| Model | Task | Framework |
|-------|------|-----------|
| **DeBERTa** | Transaction NLP risk | PyTorch |
| **ViT** | KYC document verification | PyTorch |
| **Whisper (Telugu)** | Voice authentication | PyTorch |
| **FT-Transformer** | Tabular fraud detection | PyTorch |
| **XGBoost** | PaySim fraud detection | Scikit-learn |
| **Random Forest** | Credit card fraud | Scikit-learn |
| **LSTM** | Sequential transaction analysis | Keras |
| **Cross-Attention Fusion** | Multimodal risk fusion | PyTorch |

---

## ⚡ Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/nandakishore2004/Multimodal-Risk-Assessment-in-Fintech-Application.git

# 2. Go to implementation folder
cd implementation

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run backend
python app.py

# 5. Run frontend (separate terminal)
cd frontend
npm install && npm run dev
```

> For detailed setup instructions → see [`implementation/README.md`](implementation/README.md)

---

## 🏗️ System Architecture

```
                    ┌─────────────────────────────────┐
                    │     MULTIMODAL AI SYSTEM         │
                    │                                  │
  Text Input   ──►  │  🔤 DeBERTa NLP     ─────────┐  │
  Tabular Data ──►  │  📊 FT-Transformer  ─────────┤  │
  KYC Image    ──►  │  👁️  ViT Vision      ─────────┼──►  Risk Score
  Voice (Tel.) ──►  │  🎙️  Whisper Telugu  ─────────┤  │   (0 - 100%)
  Transactions ──►  │  🌲 XGBoost         ─────────┤  │
                    │  🔄 LSTM Sequence   ─────────┘  │
                    │         ↓                        │
                    │  🔀 Cross-Attention Fusion        │
                    └─────────────────────────────────┘
```

---

## 📦 Datasets Used

| Dataset | Source |
|---------|--------|
| PaySim (Mobile Money) | [Kaggle](https://www.kaggle.com/datasets/ealaxi/paysim1) |
| Credit Card Fraud | [Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) |
| Aadhaar KYC Images | [Roboflow](https://universe.roboflow.com/surya-5hkys/back-aadhaar-card) |
| Mozilla Telugu Voice | [Mozilla](https://commonvoice.mozilla.org/en/datasets) |

> Full dataset details → [`datasets/README.md`](datasets/README.md)

---

## 👥 Team — B.Tech Final Year Major Project

**Multimodal Risk Assessment in FinTech Applications**
