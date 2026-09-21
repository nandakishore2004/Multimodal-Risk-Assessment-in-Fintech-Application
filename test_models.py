import torch, os, sys
sys.path.insert(0, r'd:\Major Project')
MODEL_DIR = r'd:\Major Project\model'

import torch.nn as nn

# ── Test FT-Transformer ──────────────────────────────────────────────────────
class FTTransformer(nn.Module):
    def __init__(self, num_features=12, embed_dim=64, num_heads=4, num_layers=3, dropout=0.1):
        super().__init__()
        self.num_features = num_features
        self.embed_dim = embed_dim
        self.feature_projections = nn.ModuleList([nn.Linear(1, embed_dim) for _ in range(num_features)])
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        encoder_layer = nn.TransformerEncoderLayer(d_model=embed_dim, nhead=num_heads, dim_feedforward=embed_dim*4, dropout=dropout, batch_first=True)
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.classifier = nn.Sequential(nn.LayerNorm(embed_dim), nn.Linear(embed_dim,32), nn.ReLU(), nn.Dropout(dropout), nn.Linear(32,2))
    def forward(self, x):
        batch_size = x.shape[0]
        tokens = [self.feature_projections[i](x[:,i:i+1]).unsqueeze(1) for i in range(self.num_features)]
        tokens = torch.cat(tokens, dim=1)
        cls = self.cls_token.expand(batch_size,-1,-1)
        tokens = torch.cat([cls, tokens], dim=1)
        out = self.transformer(tokens)
        return self.classifier(out[:,0])

print("=" * 50)
print("Testing All Real Trained Models")
print("=" * 50)

# FT-Transformer
try:
    ft = FTTransformer()
    sd = torch.load(os.path.join(MODEL_DIR,'ft_transformer_model.pt'), map_location='cpu')
    ft.load_state_dict(sd)
    ft.eval()
    x = torch.zeros(1,12)
    with torch.no_grad():
        out = ft(x)
        probs = torch.softmax(out, dim=1)
    print(f"[OK] FT-Transformer  | LEGIT={probs[0,0]:.3f} FRAUD={probs[0,1]:.3f}")
except Exception as e:
    print(f"[FAIL] FT-Transformer: {e}")

# ViT
try:
    import timm
    vit = timm.create_model('vit_base_patch16_224', pretrained=False, num_classes=2)
    sd2 = torch.load(os.path.join(MODEL_DIR,'vit_model.pt'), map_location='cpu')
    vit.load_state_dict(sd2)
    vit.eval()
    img = torch.zeros(1,3,224,224)
    with torch.no_grad():
        out2 = vit(img)
        p2 = torch.softmax(out2,dim=1)
    print(f"[OK] ViT-B/16        | AUTHENTIC={p2[0,0]:.3f} TAMPERED={p2[0,1]:.3f}")
except Exception as e:
    print(f"[FAIL] ViT: {e}")

# DeBERTa-v3
try:
    from transformers import AutoModelForSequenceClassification, AutoTokenizer
    print("[..] Loading DeBERTa-v3 tokenizer + model (may take 30s)...")
    tok = AutoTokenizer.from_pretrained('microsoft/deberta-v3-base')
    m = AutoModelForSequenceClassification.from_pretrained('microsoft/deberta-v3-base', num_labels=2)
    sd3 = torch.load(os.path.join(MODEL_DIR,'deberta_model.pt'), map_location='cpu')
    m.load_state_dict(sd3)
    m.eval()
    # Fraud test
    enc = tok('Your account is blocked! Share OTP now.', return_tensors='pt', max_length=64, padding='max_length', truncation=True)
    with torch.no_grad():
        logits = m(**enc).logits
        p3 = torch.softmax(logits,dim=1)
    print(f"[OK] DeBERTa-v3 FRAUD| LEGIT={p3[0,0]:.3f} FRAUD={p3[0,1]:.3f}")
    # Legit test
    enc2 = tok('Your account balance is Rs 5000.', return_tensors='pt', max_length=64, padding='max_length', truncation=True)
    with torch.no_grad():
        logits2 = m(**enc2).logits
        p4 = torch.softmax(logits2,dim=1)
    print(f"[OK] DeBERTa-v3 LEGIT| LEGIT={p4[0,0]:.3f} FRAUD={p4[0,1]:.3f}")
except Exception as e:
    print(f"[FAIL] DeBERTa: {e}")

print("=" * 50)
print("Test complete!")
