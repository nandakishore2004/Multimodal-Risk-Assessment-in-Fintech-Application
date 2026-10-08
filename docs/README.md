# 📄 Docs — Multimodal Risk Assessment FinTech

This folder contains all project documentation, presentations, reports, and diagrams.

---

## 📁 Contents

| File | Type | Description |
|------|------|------------|
| `Multimodal Risk Assessment in FinTech Applications_Abstract.pdf` | PDF | Project abstract |
| `Multimodal Risk Assessment in FinTech Applications_PPT.pptx` | PPT | Main presentation |
| `Literature Survey Report.docx` | Word | Literature survey |
| `Literature Survey Summary Report.docx` | Word | Summary of lit survey |
| `Literature Survey report summary.pdf` | PDF | PDF version |
| `AI_Models_Explanation.docx` | Word | AI models explanation |
| `Dataset_Reference_Guide.docx` | Word | Dataset reference guide |
| `Major Project Architecture 4th yr.doc` | Word | Architecture document |
| `Project Architecture.pdf` | PDF | Architecture PDF |
| `Project_Summary_English.docx` | Word | Project summary (English) |
| `Project_Summary_Tenglish.docx` | Word | Project summary (Tenglish) |
| `Major Project Info in English.pdf` | PDF | Full info in English |
| `Major Project Info in Tenglish.pdf` | PDF | Full info in Tenglish |
| `Presentation_Scripts_All_Members.docx` | Word | Presentation scripts |
| `Sample Abstract.docx` | Word | Abstract draft |
| `WEEKLY REPORT.pdf` | PDF | Weekly progress report |
| `Flow Diagram...Updated.png` | Image | System architecture flow diagram |
| `Team 30 Recording Session.mp4` | Video | Team recording session |
| `REFERENCES.zip` | ZIP | Reference papers collection |

---

## 🗺️ Architecture Flow Diagram

The system architecture shows how multiple AI models work together:

```
User Input (Text/Image/Voice)
        │
        ▼
┌───────────────────────────────────┐
│        Multimodal AI System       │
│                                   │
│  📝 DeBERTa NLP ──────────────┐  │
│  📊 FT-Transformer ───────────┤  │
│  🖼️  ViT KYC Vision ──────────┼──► Cross-Attention Fusion ──► Risk Score
│  🎙️  Whisper Voice ───────────┤  │
│  🌲 XGBoost Fraud ────────────┤  │
│  🔄 LSTM Sequential ──────────┘  │
└───────────────────────────────────┘
```

See `Flow Diagram for Multimodal Risk Assessment in FinTech Applications Updated.png` for full diagram.
