# 📦 Datasets — Multimodal Risk Assessment FinTech

This folder contains the datasets used for training all AI models in the project.

> ⚠️ **Note:** Some datasets are very large (600MB+). Download them from the official sources below.

---

## 📊 Datasets Overview

| Dataset | Size | Used For | Source |
|---------|------|---------|--------|
| **PaySim** | ~500 MB | Mobile payment fraud detection | Kaggle |
| **Credit Card Fraud** | ~150 MB | Credit card fraud (RF + XGBoost) | Kaggle |
| **Aadhaar KYC Images** | ~484 MB | KYC document verification (ViT) | Roboflow |
| **Mozilla Common Voice (Telugu)** | ~66 MB | Telugu voice authentication (Whisper) | Mozilla |
| **GPTeacher Telugu Romanized** | ~149 MB | Telugu NLP (DeBERTa) | Internal |

---

## ⬇️ Download Links

### 1. PaySim — Synthetic Mobile Money Transactions
```
Source  : Kaggle
Link    : https://www.kaggle.com/datasets/ealaxi/paysim1
File    : paysim dataset.csv
Use For : Train XGBoost fraud model (payism.ipynb)
```

### 2. Credit Card Fraud Detection
```
Source  : Kaggle
Link    : https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud
Files   : creditcard.csv, test.csv
Use For : Train Random Forest & XGBoost (creditcard train.ipynb)
```

### 3. Aadhaar Card KYC (Back Side) — Roboflow
```
Source  : Roboflow Universe
Link    : https://universe.roboflow.com/surya-5hkys/back-aadhaar-card
Format  : COCO format (images + annotations)
Use For : Train ViT KYC document model (train_vit_kyc.ipynb)
```

### 4. Mozilla Common Voice — Telugu
```
Source  : Mozilla Common Voice
Link    : https://commonvoice.mozilla.org/en/datasets
Version : cv-corpus-26.0-2026-06-12
Use For : Fine-tune Whisper for Telugu voice auth (train_telugu_voice.py)
```

### 5. GPTeacher Telugu Romanized
```
Source  : Internal / HuggingFace
File    : gpteacher_cleaned_filtered_telugu_romanized.csv
Use For : DeBERTa NLP training (train_deberta_nlp.ipynb)
Size    : ~149 MB
```

---

## 📁 Local Folder Structure (after download)

```
datasets/
├── Back Aadhaar Card.v2i.coco/     # KYC images (COCO format)
├── creditcard.csv/                  # Credit card fraud data
├── paysim dataset.csv/              # PaySim transactions
├── test.csv/                        # Test split
├── cv-corpus-26.0-2026-06-12/      # Telugu voice corpus
├── v1-plastic-covered-recaptured/   # Additional KYC images
└── gpteacher_cleaned_filtered_telugu_romanized.csv
```

---

## 📝 Dataset Details

### PaySim
- **Rows**: 6.3 million transactions
- **Features**: step, type, amount, nameOrig, oldbalanceOrg, newbalanceOrig, nameDest, oldbalanceDest, newbalanceDest, isFraud, isFlaggedFraud
- **Fraud Rate**: ~0.13%

### Credit Card Fraud
- **Rows**: 284,807 transactions
- **Features**: V1-V28 (PCA), Time, Amount, Class
- **Fraud Rate**: ~0.17%

### Telugu Voice Corpus
- **Language**: Telugu
- **Format**: MP3 audio + TSV transcripts
- **Use**: Fine-tune OpenAI Whisper small model
