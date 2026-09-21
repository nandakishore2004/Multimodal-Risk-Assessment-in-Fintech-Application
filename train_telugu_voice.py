import os, sys, warnings, time, json
warnings.filterwarnings("ignore")
os.environ["PYTHONIOENCODING"] = "utf-8"

BASE_DIR   = r"d:\Major Project"
DATA_DIR   = os.path.join(BASE_DIR, "DATASETS MAJOR PROJECT", "cv-corpus-26.0-2026-06-12", "te")
CLIPS_DIR  = os.path.join(DATA_DIR, "clips")
MODEL_DIR  = os.path.join(BASE_DIR, "model", "telugu_whisper_finetuned")
PROGRESS_FILE = os.path.join(BASE_DIR, "model", "training_progress.json")
os.makedirs(MODEL_DIR, exist_ok=True)

TRAIN_TSV = os.path.join(DATA_DIR, "train.tsv")
TEST_TSV  = os.path.join(DATA_DIR, "test.tsv")
VAL_TSV   = os.path.join(DATA_DIR, "dev.tsv")

MAX_EPOCHS    = 5
BATCH_SIZE    = 4
LEARNING_RATE = 1e-5
WHISPER_MODEL = "small"
MAX_TRAIN     = 80
MAX_TEST      = 50

def save_progress(data):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# Initial progress
save_progress({"status": "starting", "phase": "Loading libraries...", "epoch": 0,
               "max_epochs": MAX_EPOCHS, "batch": 0, "max_batches": 0,
               "train_losses": [], "val_losses": [], "epoch_times": [],
               "current_train_loss": None, "current_val_loss": None,
               "pct": 0, "wer": None, "cer": None, "token_acc": None,
               "char_acc": None, "exact_acc": None, "start_time": time.time()})

import numpy as np, pandas as pd, torch
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt, matplotlib.gridspec as gridspec
import whisper
from whisper.audio import log_mel_spectrogram, pad_or_trim
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from jiwer import wer, cer

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Device: {DEVICE.upper()}")
tokenizer = whisper.tokenizer.get_tokenizer(multilingual=True, language="te")
SOT = tokenizer.sot; EOT = tokenizer.eot

save_progress({"status": "loading_data", "phase": "Reading dataset...", "epoch": 0,
               "max_epochs": MAX_EPOCHS, "batch": 0, "max_batches": 0,
               "train_losses": [], "val_losses": [], "epoch_times": [],
               "current_train_loss": None, "current_val_loss": None,
               "pct": 2, "wer": None, "cer": None, "token_acc": None,
               "char_acc": None, "exact_acc": None, "start_time": time.time()})

def read_tsv(path, max_rows=None):
    df = pd.read_csv(path, sep="\t", on_bad_lines="skip", encoding="utf-8")
    df = df[["path","sentence"]].dropna()
    df["sentence"] = df["sentence"].astype(str).str.strip()
    df = df[df["sentence"].str.len() > 0]
    if max_rows: df = df.head(max_rows)
    return df.reset_index(drop=True)

train_df = read_tsv(TRAIN_TSV, MAX_TRAIN)
test_df  = read_tsv(TEST_TSV,  MAX_TEST)
val_df   = read_tsv(VAL_TSV,   40)
print(f"Train:{len(train_df)} Val:{len(val_df)} Test:{len(test_df)}")

def load_audio(mp3_path):
    try:
        audio = whisper.load_audio(mp3_path)
        return pad_or_trim(audio)
    except: return None

class TeluguDataset(Dataset):
    def __init__(self, df, clips_dir):
        valid = []
        for _, row in df.iterrows():
            fpath = os.path.join(clips_dir, row["path"])
            if os.path.exists(fpath):
                valid.append({"path": fpath, "sentence": row["sentence"]})
        self.data = valid

    def __len__(self): return len(self.data)

    def __getitem__(self, idx):
        row = self.data[idx]
        audio = load_audio(row["path"])
        if audio is None: audio = np.zeros(16000*5, dtype=np.float32)
        mel    = log_mel_spectrogram(audio).to(DEVICE)
        tokens = tokenizer.encode(row["sentence"])
        tokens = [SOT] + tokens + [EOT]
        return {"mel": mel, "tokens": torch.tensor(tokens, dtype=torch.long)}

def collate_fn(batch):
    mels  = torch.stack([b["mel"] for b in batch])
    max_t = max(b["tokens"].shape[0] for b in batch)
    toks  = torch.zeros(len(batch), max_t, dtype=torch.long)
    for i,b in enumerate(batch):
        t = b["tokens"]; toks[i,:t.shape[0]] = t
    return mels, toks

save_progress({"status": "loading_model", "phase": "Loading Whisper-small model...", "epoch": 0,
               "max_epochs": MAX_EPOCHS, "batch": 0, "max_batches": 0,
               "train_losses": [], "val_losses": [], "epoch_times": [],
               "current_train_loss": None, "current_val_loss": None,
               "pct": 5, "wer": None, "cer": None, "token_acc": None,
               "char_acc": None, "exact_acc": None, "start_time": time.time()})

print("Loading Whisper model...")
model = whisper.load_model(WHISPER_MODEL, device=DEVICE)
print("Model loaded!")

train_ds = TeluguDataset(train_df, CLIPS_DIR)
val_ds   = TeluguDataset(val_df,   CLIPS_DIR)
test_ds  = TeluguDataset(test_df,  CLIPS_DIR)
n_train  = len(train_ds.data)
max_batches = (n_train + BATCH_SIZE - 1) // BATCH_SIZE
train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  collate_fn=collate_fn)
val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, collate_fn=collate_fn)

optimizer = AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=1e-2)
scheduler = CosineAnnealingLR(optimizer, T_max=MAX_EPOCHS)

train_losses, val_losses, epoch_times = [], [], []
start_time = time.time()

for epoch in range(1, MAX_EPOCHS+1):
    t0 = time.time()
    model.train()
    ep_loss, n_b = 0.0, 0

    for batch_idx, (mels, tokens) in enumerate(train_loader):
        mels = mels.to(DEVICE); tokens = tokens.to(DEVICE)
        af = model.encoder(mels)
        ii = tokens[:,:-1]; ti = tokens[:,1:]
        lg = model.decoder(ii, af)
        B,T,V = lg.shape
        loss = torch.nn.functional.cross_entropy(lg.reshape(B*T,V), ti.reshape(B*T), ignore_index=0)
        optimizer.zero_grad(); loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        ep_loss += loss.item(); n_b += 1

        # Save progress after every batch
        overall_pct = int(((epoch-1)*max_batches + n_b) / (MAX_EPOCHS*max_batches) * 80)
        save_progress({
            "status": "training",
            "phase": f"Epoch {epoch}/{MAX_EPOCHS} — Batch {n_b}/{max_batches}",
            "epoch": epoch, "max_epochs": MAX_EPOCHS,
            "batch": n_b, "max_batches": max_batches,
            "train_losses": train_losses,
            "val_losses": val_losses,
            "epoch_times": epoch_times,
            "current_train_loss": round(ep_loss/n_b, 4),
            "current_val_loss": val_losses[-1] if val_losses else None,
            "pct": 5 + overall_pct,
            "wer": None, "cer": None, "token_acc": None,
            "char_acc": None, "exact_acc": None,
            "start_time": start_time,
            "elapsed": round(time.time()-start_time, 1)
        })

    scheduler.step()
    avg_train = ep_loss / max(n_b,1)

    model.eval()
    v_loss, v_b = 0.0, 0
    with torch.no_grad():
        for mels, tokens in val_loader:
            mels=mels.to(DEVICE); tokens=tokens.to(DEVICE)
            af=model.encoder(mels); ii=tokens[:,:-1]; ti=tokens[:,1:]
            lg=model.decoder(ii,af); B,T,V=lg.shape
            v_loss+=torch.nn.functional.cross_entropy(lg.reshape(B*T,V),ti.reshape(B*T),ignore_index=0).item()
            v_b+=1
    avg_val   = v_loss / max(v_b,1)
    elapsed   = time.time()-t0
    train_losses.append(round(avg_train,4))
    val_losses.append(round(avg_val,4))
    epoch_times.append(round(elapsed,1))
    print(f"Epoch {epoch}/{MAX_EPOCHS} | Train:{avg_train:.4f} | Val:{avg_val:.4f} | {elapsed:.1f}s")

    save_progress({
        "status": "training",
        "phase": f"Epoch {epoch} complete! Val Loss: {avg_val:.4f}",
        "epoch": epoch, "max_epochs": MAX_EPOCHS,
        "batch": max_batches, "max_batches": max_batches,
        "train_losses": train_losses, "val_losses": val_losses, "epoch_times": epoch_times,
        "current_train_loss": round(avg_train,4), "current_val_loss": round(avg_val,4),
        "pct": int(5 + epoch/MAX_EPOCHS*80),
        "wer": None, "cer": None, "token_acc": None, "char_acc": None, "exact_acc": None,
        "start_time": start_time, "elapsed": round(time.time()-start_time,1)
    })

print("Evaluating...")
save_progress({**json.load(open(PROGRESS_FILE)), "status":"evaluating","phase":"Evaluating on test set...","pct":88})

model.eval()
references, hypotheses, exact_count = [], [], 0
for i,item in enumerate(test_ds.data):
    try:
        res = model.transcribe(item["path"], language="te", fp16=False)
        hyp=res["text"].strip(); ref=item["sentence"].strip()
        references.append(ref); hypotheses.append(hyp)
        if hyp.lower()==ref.lower(): exact_count+=1
        pct_eval = 88 + int(i/len(test_ds.data)*10)
        save_progress({**json.load(open(PROGRESS_FILE)), "phase":f"Evaluating: {i+1}/{len(test_ds.data)} clips","pct":pct_eval})
    except: continue

total     = len(references)
WER_val   = wer(references,hypotheses)  if total>0 else 1.0
CER_val   = cer(references,hypotheses)  if total>0 else 1.0
exact_acc = exact_count/total*100       if total>0 else 0.0
token_acc = max(0,(1-WER_val))*100
char_acc  = max(0,(1-CER_val))*100

# Save chart
print("Saving chart...")
fig = plt.figure(figsize=(16,10), facecolor="#0d1117")
fig.suptitle("Telugu ASR Fine-Tuning Report  |  Whisper-small  |  Common Voice 26",
             color="white",fontsize=16,fontweight="bold",y=0.97)
gs = gridspec.GridSpec(2,3,figure=fig,hspace=0.45,wspace=0.4)
epochs_x = list(range(1,MAX_EPOCHS+1))

ax1=fig.add_subplot(gs[0,:2])
ax1.plot(epochs_x,train_losses,"o-",color="#6366f1",lw=2.5,label="Train Loss",ms=7)
ax1.plot(epochs_x,val_losses,"s--",color="#f59e0b",lw=2.5,label="Val Loss",ms=7)
ax1.set_facecolor("#161b22"); ax1.set_xlabel("Epoch",color="#94a3b8")
ax1.set_ylabel("Loss",color="#94a3b8"); ax1.set_title("Training & Validation Loss",color="white",fontweight="bold")
ax1.legend(facecolor="#0d1117",edgecolor="#30363d",labelcolor="white")
ax1.tick_params(colors="#94a3b8"); ax1.grid(True,alpha=0.2,color="#30363d")
for s in ax1.spines.values(): s.set_color("#30363d")

ax2=fig.add_subplot(gs[0,2])
bars2=ax2.bar(epochs_x,epoch_times,color="#8b5cf6",alpha=0.85,width=0.6)
ax2.set_facecolor("#161b22"); ax2.set_xlabel("Epoch",color="#94a3b8")
ax2.set_ylabel("Seconds",color="#94a3b8"); ax2.set_title("Time per Epoch",color="white",fontweight="bold")
ax2.tick_params(colors="#94a3b8"); ax2.grid(True,alpha=0.2,axis="y",color="#30363d")
for s in ax2.spines.values(): s.set_color("#30363d")
for bar,t in zip(bars2,epoch_times):
    ax2.text(bar.get_x()+bar.get_width()/2,bar.get_height()+0.3,f"{t:.0f}s",ha="center",color="white",fontsize=8)

ax3=fig.add_subplot(gs[1,:2])
mnames=["Token\nAccuracy","Char\nAccuracy","Exact\nAccuracy"]
mvals=[token_acc,char_acc,exact_acc]
mcols=["#10b981","#6366f1","#f59e0b"]
bars3=ax3.bar(mnames,mvals,color=mcols,alpha=0.9,width=0.5)
ax3.set_facecolor("#161b22"); ax3.set_ylim(0,115)
ax3.set_ylabel("Accuracy (%)",color="#94a3b8"); ax3.set_title("Test Set Accuracy Metrics",color="white",fontweight="bold")
ax3.tick_params(colors="#94a3b8"); ax3.grid(True,alpha=0.2,axis="y",color="#30363d")
for s in ax3.spines.values(): s.set_color("#30363d")
for bar,v in zip(bars3,mvals):
    ax3.text(bar.get_x()+bar.get_width()/2,bar.get_height()+1.5,f"{v:.1f}%",ha="center",color="white",fontsize=11,fontweight="bold")

ax4=fig.add_subplot(gs[1,2])
enames=["WER","CER"]; evals=[WER_val*100,CER_val*100]
ecols=["#ef4444" if WER_val>0.5 else "#10b981","#ef4444" if CER_val>0.4 else "#10b981"]
bars4=ax4.barh(enames,evals,color=ecols,alpha=0.9)
ax4.set_facecolor("#161b22"); ax4.set_xlim(0,105)
ax4.set_xlabel("Error Rate (%)",color="#94a3b8"); ax4.set_title("WER & CER\n(lower=better)",color="white",fontweight="bold")
ax4.tick_params(colors="#94a3b8"); ax4.grid(True,alpha=0.2,axis="x",color="#30363d")
for s in ax4.spines.values(): s.set_color("#30363d")
for bar,v in zip(bars4,evals):
    ax4.text(bar.get_width()+1,bar.get_y()+bar.get_height()/2,f"{v:.1f}%",va="center",color="white",fontsize=10,fontweight="bold")

summary=(f"Whisper-small | Telugu | CV-26.0 | Epochs:{MAX_EPOCHS} | Train:{len(train_ds.data)} Test:{total} | "
         f"WER:{WER_val*100:.1f}% | CER:{CER_val*100:.1f}% | TokenAcc:{token_acc:.1f}% | CharAcc:{char_acc:.1f}%")
fig.text(0.01,0.01,summary,color="#94a3b8",fontsize=8,style="monospace",
         bbox=dict(facecolor="#161b22",edgecolor="#30363d",pad=6,alpha=0.8))

cpath=os.path.join(BASE_DIR,"model","telugu_training_report.png")
plt.savefig(cpath,dpi=150,bbox_inches="tight",facecolor=fig.get_facecolor())
plt.close()

torch.save(model.state_dict(), os.path.join(MODEL_DIR,"telugu_whisper_small.pt"))

final = {
    "status": "done",
    "phase": "Training Complete!",
    "epoch": MAX_EPOCHS, "max_epochs": MAX_EPOCHS,
    "batch": max_batches, "max_batches": max_batches,
    "train_losses": train_losses, "val_losses": val_losses, "epoch_times": epoch_times,
    "current_train_loss": train_losses[-1], "current_val_loss": val_losses[-1],
    "pct": 100,
    "wer": round(WER_val*100,2), "cer": round(CER_val*100,2),
    "token_acc": round(token_acc,2), "char_acc": round(char_acc,2), "exact_acc": round(exact_acc,2),
    "start_time": start_time, "elapsed": round(time.time()-start_time,1),
    "chart_path": cpath
}
save_progress(final)
with open(os.path.join(BASE_DIR,"model","telugu_metrics.json"),"w",encoding="utf-8") as f:
    json.dump(final,f,indent=2,ensure_ascii=False)

print("="*55)
print("TRAINING COMPLETE!")
print(f"WER: {WER_val*100:.2f}%  CER: {CER_val*100:.2f}%")
print(f"Token Acc: {token_acc:.2f}%  Char Acc: {char_acc:.2f}%  Exact: {exact_acc:.2f}%")
print("="*55)