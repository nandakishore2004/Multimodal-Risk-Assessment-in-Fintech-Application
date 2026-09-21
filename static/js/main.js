/**
 * NeoPay Web — Real-World FinTech Core Controller
 * Handles consumer payment flow, live wallet state, and the background AI Security Guardian
 */

// ── Application State ──────────────────────────────────────────
const state = {
  wallet_balance: 50000.00,
  current_payee_id: 'ananya@okhdfcbank',
  current_payee_name: 'Ananya Verma',
  is_scam_risk: false,
  has_image: false,
  has_voice: false,
  voice_transcript: '',
  is_recording: false,
  last_audit_data: null
};

let loanMediaRecorder = null;
let loanAudioChunks = [];

function toggleTheme() {
  const light = !document.body.classList.contains('light-theme');
  document.body.classList.toggle('light-theme', light);
  const toggle = document.getElementById('theme-toggle');
  toggle.innerHTML = light ? '🌙 <span>Dark</span>' : '☀️ <span>Light</span>';
  localStorage.setItem('neorisk-theme', light ? 'light' : 'dark');
}

async function loginUser(event) {
  event.preventDefault();
  const message = document.getElementById('login-message');
  const payload = { email: document.getElementById('login-email').value.trim(), password: document.getElementById('login-password').value };
  message.textContent = 'Signing in…';
  try {
    const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'Sign in failed');
    sessionStorage.setItem('neorisk-user', JSON.stringify(data.user));
    applyLoggedInUser(data.user);
  } catch (error) { message.textContent = error.message; }
}

function applyLoggedInUser(user) {
  document.getElementById('header-user-name').textContent = user.name;
  document.getElementById('header-upi').textContent = user.email;
  document.getElementById('loan-name').value = user.name;
  document.getElementById('loan-credit-score').value = user.credit_score;
  document.getElementById('login-overlay').style.display = 'none';
}

async function uploadLoanKyc(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const status = document.getElementById('loan-kyc-status');
  status.textContent = `Scanning ${file.name} with ViT-B/16…`;
  const body = new FormData(); body.append('kyc_document', file);
  try {
    const response = await fetch('/api/kyc_analyze', { method: 'POST', body });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || 'KYC scan failed');
    document.getElementById('loan-kyc-score').value = data.fraud_prob;
    status.textContent = `${data.prediction} · visual risk ${(data.fraud_prob * 100).toFixed(0)}% · ${data.guidance}`;
    status.className = data.fraud_prob > 0.5 ? 'kyc-status risk' : 'kyc-status safe';
    showToast('KYC document analyzed', data.fraud_prob > 0.5 ? 'warning' : 'success');
  } catch (error) { status.textContent = error.message; status.className = 'kyc-status risk'; showToast(error.message, 'danger'); }
}

// ── Loan assessment workflow ──────────────────────────────────
function setAppMode(mode) {
  const loan = mode === 'loan';
  document.getElementById('loan-workspace').style.display = loan ? 'block' : 'none';
  document.getElementById('payment-workspace').style.display = loan ? 'none' : 'block';
  document.getElementById('loan-mode-button').classList.toggle('active', loan);
  document.getElementById('payment-mode-button').classList.toggle('active', !loan);
}

function loadLoanScenario(kind) {
  const values = {
    strong: { income: 65000, obligations: 8000, score: 760, amount: 300000, tenure: 24, employment: 3, missed: 0, network: 10, purpose: 'Home renovation and essential family expenses', voice: 'I confirm that this loan application is genuine.' },
    review: { income: 42000, obligations: 16000, score: 670, amount: 500000, tenure: 36, employment: 1, missed: 1, network: 35, purpose: 'Medical expenses and debt consolidation', voice: 'I request a loan for an urgent family need.' },
    risky: { income: 28000, obligations: 18000, score: 560, amount: 900000, tenure: 24, employment: 0.5, missed: 3, network: 80, purpose: 'Urgent! Transfer loan money immediately to claim a prize and unblock account', voice: 'Urgent OTP password money transfer account blocked' }
  };
  const s = values[kind];
  document.getElementById('loan-income').value = s.income;
  document.getElementById('loan-obligations').value = s.obligations;
  document.getElementById('loan-credit-score').value = s.score;
  document.getElementById('loan-amount').value = s.amount;
  document.getElementById('loan-tenure').value = s.tenure;
  document.getElementById('loan-employment').value = s.employment;
  document.getElementById('loan-missed-emis').value = s.missed;
  document.getElementById('loan-network-risk').value = s.network;
  document.getElementById('loan-purpose').value = s.purpose;
  document.getElementById('loan-voice').value = s.voice;
  document.getElementById('loan-voice-status').textContent = `Demo voice evidence loaded: “${s.voice.slice(0, 48)}...”`;
  document.getElementById('loan-kyc-score').value = '';
  document.getElementById('loan-kyc-status').textContent = 'No document uploaded yet. Upload a KYC image to include visual verification.';
  showToast(`Loaded ${kind === 'strong' ? 'strong applicant' : kind === 'review' ? 'manual-review' : 'high-risk'} profile`, kind === 'risky' ? 'danger' : 'info');
}

function esc(value) {
  const el = document.createElement('span');
  el.textContent = String(value ?? '');
  return el.innerHTML;
}

function money(value) { return `₹${Number(value || 0).toLocaleString('en-IN')}`; }

async function toggleLoanVoice() {
  const button = document.getElementById('loan-voice-btn');
  const status = document.getElementById('loan-voice-status');
  if (loanMediaRecorder && loanMediaRecorder.state === 'recording') {
    loanMediaRecorder.stop();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    loanAudioChunks = [];
    loanMediaRecorder = new MediaRecorder(stream);
    loanMediaRecorder.ondataavailable = event => { if (event.data.size) loanAudioChunks.push(event.data); };
    loanMediaRecorder.onstop = async () => {
      stream.getTracks().forEach(track => track.stop());
      button.classList.remove('recording');
      button.disabled = true;
      button.textContent = 'Transcribing...';
      status.textContent = 'Analyzing Telugu / English speech with Whisper…';
      const formData = new FormData();
      formData.append('audio', new Blob(loanAudioChunks, { type: 'audio/webm' }), 'loan-declaration.webm');
      try {
        const response = await fetch('/api/voice_analyze', { method: 'POST', body: formData });
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Speech analysis failed');
        document.getElementById('loan-voice').value = data.final_transcript || '';
        const riskNote = data.fraud_prob > 0.5 ? ' Elevated voice-risk keywords detected.' : ' Voice declaration verified.';
        status.textContent = (data.final_transcript ? `“${data.final_transcript}”` : 'Voice recorded.') + riskNote;
        button.textContent = '🎙️ Re-record declaration';
        showToast('Voice declaration captured', data.fraud_prob > 0.5 ? 'warning' : 'success');
      } catch (error) {
        status.textContent = 'Voice was recorded, but transcription was unavailable. Please try again.';
        button.textContent = '🎙️ Try again';
        showToast('Could not transcribe the voice declaration', 'danger');
      } finally { button.disabled = false; }
    };
    loanMediaRecorder.start();
    button.classList.add('recording');
    button.textContent = '⏹ Stop recording';
    status.textContent = 'Listening… say your loan declaration in Telugu or English.';
  } catch (error) {
    showToast('Microphone permission is required for voice declaration', 'danger');
  }
}

async function submitLoanApplication(event) {
  event.preventDefault();
  const submit = event.currentTarget.querySelector('button[type="submit"]');
  const old = submit.innerHTML;
  submit.disabled = true;
  submit.innerHTML = 'Assessing financial and multimodal evidence...';
  const payload = {
    applicant_name: document.getElementById('loan-name').value.trim(),
    monthly_income: Number(document.getElementById('loan-income').value),
    monthly_obligations: Number(document.getElementById('loan-obligations').value),
    credit_score: Number(document.getElementById('loan-credit-score').value),
    loan_amount: Number(document.getElementById('loan-amount').value),
    tenure_months: Number(document.getElementById('loan-tenure').value),
    employment_years: Number(document.getElementById('loan-employment').value),
    missed_emis: Number(document.getElementById('loan-missed-emis').value),
    reference_risk: Number(document.getElementById('loan-network-risk').value),
    purpose: document.getElementById('loan-purpose').value.trim(),
    voice_transcript: document.getElementById('loan-voice').value.trim(),
    has_kyc: Boolean(document.getElementById('loan-kyc-score').value),
    kyc_fraud_prob: document.getElementById('loan-kyc-score').value || null
  };
  try {
    const res = await fetch('/api/loan_assess', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Loan assessment could not be completed');
    renderLoanDecision(data);
    state.last_audit_data = data.multimodal_assessment;
    showToast(`${data.decision}: application ${data.application_id}`, data.decision_code === 'approved' ? 'success' : data.decision_code === 'review' ? 'warning' : 'danger');
  } catch (error) {
    showToast(error.message, 'danger');
  } finally {
    submit.disabled = false;
    submit.innerHTML = old;
  }
}

function renderLoanDecision(data) {
  const content = document.getElementById('loan-result-content');
  document.getElementById('loan-result-empty').style.display = 'none';
  content.style.display = 'block';
  const cls = `decision-${data.decision_code}`;
  const financial = data.financial_summary;
  const factors = (data.factors || []).slice(0, 5).map(x => `<li>${esc(x)}</li>`).join('');
  const offers = (data.bank_recommendations || []).map(o => `<div class="bank-offer"><strong>${esc(o.bank)} — ${esc(o.product)}</strong><p>${o.interest_rate}% p.a. · ${money(o.approved_amount)} · EMI ${money(o.estimated_emi)} / month</p><p>${esc(o.why_recommended)}</p></div>`).join('') || '<p class="loan-disclaimer">No bank matches the current profile rules. Improve the listed factors or request manual review.</p>';
  const rules = (data.bank_rules || []).map(rule => `<div class="bank-rule ${rule.eligible ? 'eligible' : 'ineligible'}"><strong>${esc(rule.bank)} — ${rule.eligible ? 'Eligible' : 'Not eligible now'}</strong><p>${rule.rules.map(esc).join(' · ')}</p><small>${rule.reasons.map(esc).join(' ')}</small></div>`).join('');
  content.innerHTML = `<div class="loan-decision ${cls}"><div class="decision-label">APPLICATION ${esc(data.application_id)}</div><h2>${esc(data.decision)}</h2><p>${esc(data.applicant_name)} · loan decision support result</p><div class="score-circle">${data.eligibility_score}</div></div><div class="loan-metrics"><div class="loan-metric"><span>Overall risk</span><strong>${data.overall_risk}/100</strong></div><div class="loan-metric"><span>Proposed EMI</span><strong>${money(financial.proposed_emi)}</strong></div><div class="loan-metric"><span>Debt-to-income</span><strong>${financial.debt_to_income_percent}%</strong></div><div class="loan-metric"><span>Credit score</span><strong>${financial.credit_score}</strong></div></div><h3>Explainable evidence</h3><ul class="loan-factor-list">${factors}</ul><h3>Recommended lenders</h3>${offers}<h3>Rules applied to your profile</h3>${rules}<p class="loan-disclaimer">${esc(data.disclaimer)}</p>`;
}

// ── Audio & Waveform Setup ─────────────────────────────────────
let mediaRecorder = null;
let audioChunks = [];
let audioContext = null;
let analyser = null;
let animFrameId = null;

// ── Toast System ───────────────────────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${type === 'danger' ? '🛑' : (type === 'success' ? '✅' : '⚡')}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}

// ── Payee Selection ────────────────────────────────────────────
function selectPayee(upiId, name, type) {
  state.current_payee_id = upiId;
  state.current_payee_name = name;
  state.is_scam_risk = (type === 'scammer');

  document.getElementById('payee-input').value = upiId;

  // Highlight selected chip
  const chips = document.querySelectorAll('.payee-chip');
  chips.forEach(c => c.classList.remove('selected'));
  event.currentTarget.classList.add('selected');

  if (type === 'scammer') {
    document.getElementById('pay-amount').value = 50000;
    document.getElementById('pay-note').value = 'Urgent prize claim fee! Account blocked, share OTP immediately.';
    updatePayButton();
    showToast('⚠️ Flagged Beneficiary: High Risk Warning', 'danger');
  } else {
    updatePayButton();
  }
}

// ── Amount & Scenario Helpers ──────────────────────────────────
function setAmount(val) {
  document.getElementById('pay-amount').value = val;
  updatePayButton();
}

function updatePayButton() {
  const amt = parseFloat(document.getElementById('pay-amount').value) || 0;
  const btnText = document.getElementById('pay-btn-text');
  if (btnText) {
    btnText.innerText = `PAY ₹${amt.toLocaleString('en-IN')} NOW`;
  }
}

document.getElementById('pay-amount')?.addEventListener('input', updatePayButton);

function setScenario(type) {
  const noteInput = document.getElementById('pay-note');
  const amtInput = document.getElementById('pay-amount');

  if (type === 'legit') {
    noteInput.value = 'Dinner bill split from yesterday';
    amtInput.value = 1200;
    state.is_scam_risk = false;
    showToast('Loaded normal dinner payment scenario', 'success');
  } else if (type === 'telugu') {
    noteInput.value = 'అర్జెంట్! మీ అకౌంట్ బ్లాక్ చేయబడింది. వెంటనే ఓటీపీ (OTP) షేర్ చేసి వెరిఫై చేసుకోండి.';
    amtInput.value = 25000;
    state.is_scam_risk = true;
    showToast('Loaded Telugu urgency scenario', 'warning');
  } else if (type === 'fraud') {
    noteInput.value = 'Urgent! Your SBI account has been frozen. Immediate OTP transfer required to avoid permanent suspension.';
    amtInput.value = 50000;
    state.is_scam_risk = true;
    showToast('Loaded high-risk phishing fraud scenario', 'danger');
  }
  updatePayButton();
}

// ── Voice Authorization (Whisper ASR) ──────────────────────────
async function toggleVoiceAuth() {
  const btn = document.getElementById('voice-auth-btn');
  const label = document.getElementById('voice-btn-label');
  const feedback = document.getElementById('voice-feedback');
  const transcriptEl = document.getElementById('voice-transcript-text');

  if (!state.is_recording) {
    // START RECORDING
    audioChunks = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.is_recording = true;

      // Waveform setup
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      feedback.style.display = 'block';
      drawWaveform();

      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        if (animFrameId) cancelAnimationFrame(animFrameId);

        state.has_voice = true;
        const blob = new Blob(audioChunks, { type: 'audio/webm' });

        label.innerText = 'Transcribing...';
        transcriptEl.innerText = 'Transcribing with Telugu Whisper Model...';

        const formData = new FormData();
        formData.append('audio', blob, 'voice.webm');
        formData.append('transcript', state.voice_transcript || '');

        try {
          const res = await fetch('/api/voice_analyze', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success) {
            state.voice_transcript = data.final_transcript;
            transcriptEl.innerHTML = `<strong>Transcript:</strong> "${data.final_transcript || 'Audio verified'}" &bull; <span style="color:${data.fraud_prob > 0.5 ? '#ef4444' : '#10b981'}">${data.prediction}</span>`;
            showToast('Voice authorization captured', 'success');
          }
        } catch (e) {
          transcriptEl.innerText = 'Voice recorded (Backend speech engine ready)';
        } finally {
          btn.classList.remove('recording');
          label.innerText = 'Voice Attached ✓';
        }
      };

      mediaRecorder.start(200);
      btn.classList.add('recording');
      label.innerText = 'Stop Recording';
      transcriptEl.innerText = 'Listening... Speak in Telugu or English.';

    } catch (err) {
      showToast('Microphone access denied', 'danger');
    }
  } else {
    // STOP
    state.is_recording = false;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  }
}

function drawWaveform() {
  const canvas = document.getElementById('app-waveform');
  if (!canvas || !analyser) return;

  const ctx = canvas.getContext('2d');
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function render() {
    animFrameId = requestAnimationFrame(render);
    analyser.getByteTimeDomainData(dataArray);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#6366f1';
    ctx.beginPath();

    const sliceWidth = (canvas.width * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }
  render();
}

// ── KYC Document Handling ──────────────────────────────────────
function handleKYCUpload(e) {
  if (e.target.files && e.target.files.length > 0) {
    const file = e.target.files[0];
    state.has_image = true;

    const reader = new FileReader();
    reader.onload = ev => {
      document.getElementById('kyc-thumb').src = ev.target.result;
      document.getElementById('kyc-preview-row').style.display = 'flex';
      document.getElementById('kyc-btn-label').innerText = 'ID Attached ✓';
      showToast(`KYC ID Attached: ${file.name}`, 'success');
    };
    reader.readAsDataURL(file);
  }
}

// ── Execute Payment (Real-World FinTech Flow) ───────────────────
async function executePayment() {
  const btn = document.getElementById('pay-now-btn');
  const btnText = document.getElementById('pay-btn-text');
  const originalText = btnText.innerText;

  btnText.innerText = 'SECURING & ROUTING TRANSACTION...';
  btn.style.opacity = '0.75';
  btn.style.pointerEvents = 'none';

  const recipientId = document.getElementById('payee-input').value.trim() || state.current_payee_id;
  const amount = parseFloat(document.getElementById('pay-amount').value) || 0;
  const note = document.getElementById('pay-note').value.trim();

  const payload = {
    recipient_id: recipientId,
    recipient_name: state.current_payee_name,
    amount: amount,
    note: note,
    voice_transcript: state.voice_transcript,
    has_voice: state.has_voice,
    has_image: state.has_image,
    demo_force_fake_image: state.is_scam_risk,
    demo_force_suspicious_voice: state.is_scam_risk
  };

  try {
    const res = await fetch('/api/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    state.last_audit_data = data.audit;

    if (data.status === 'APPROVED') {
      handlePaymentSuccess(data);
    } else if (data.status === 'BLOCKED') {
      handlePaymentBlocked(data);
    } else if (data.status === 'FLAGGED') {
      handlePaymentFlagged(data);
    } else {
      showToast(data.message || 'Payment could not be completed', 'danger');
    }

  } catch (err) {
    showToast('Network / Server connection error', 'danger');
  } finally {
    btnText.innerText = originalText;
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
  }
}

function handlePaymentSuccess(data) {
  // Update wallet balance display
  state.wallet_balance = data.new_balance;
  document.getElementById('wallet-balance').innerText = `₹${data.new_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Populate Success Modal
  document.getElementById('success-amount').innerText = `₹${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('success-payee').innerText = `Paid to ${data.recipient_name}`;
  document.getElementById('success-tx-id').innerText = data.tx_id;
  document.getElementById('success-risk-score').innerText = `${data.overall_risk} / 100 (Safe)`;

  showModalState('modal-success');

  // Prepend to Recent Activity List
  addActivityItem(data.recipient_name, `₹${data.amount.toLocaleString('en-IN')}`, 'success');
}

function handlePaymentBlocked(data) {
  document.getElementById('blocked-amount').innerText = `₹${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  document.getElementById('blocked-payee').innerText = data.recipient_id;
  document.getElementById('blocked-risk-score').innerText = `${data.overall_risk} / 100 (Critical)`;

  const list = document.getElementById('blocked-reasons');
  list.innerHTML = '';
  (data.risk_factors || []).forEach(rf => {
    const li = document.createElement('li');
    li.innerText = rf;
    list.appendChild(li);
  });

  showModalState('modal-blocked');

  // Prepend blocked to activity list
  addActivityItem(`Cyber Threat: ${data.recipient_name}`, 'BLOCKED', 'blocked');
}

function handlePaymentFlagged(data) {
  document.getElementById('flagged-amount').innerText = `₹${data.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const list = document.getElementById('flagged-reasons');
  list.innerHTML = '';
  (data.risk_factors || []).forEach(rf => {
    const li = document.createElement('li');
    li.innerText = rf;
    list.appendChild(li);
  });

  showModalState('modal-flagged');
}

function showModalState(activeId) {
  const modal = document.getElementById('payment-modal');
  ['modal-success', 'modal-blocked', 'modal-flagged'].forEach(id => {
    document.getElementById(id).style.display = (id === activeId) ? 'block' : 'none';
  });
  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('payment-modal').style.display = 'none';
}

function addActivityItem(title, amount, type) {
  const list = document.getElementById('activity-list');
  const item = document.createElement('div');
  item.className = `activity-item ${type}`;
  item.innerHTML = `
    <div class="act-icon">${type === 'blocked' ? '🛑' : '💸'}</div>
    <div class="act-info">
      <div class="act-title">${title}</div>
      <div class="act-time">Just now &bull; UPI Transfer</div>
    </div>
    <div class="act-amount ${type === 'blocked' ? 'blocked' : 'debit'}">${type === 'blocked' ? 'BLOCKED' : '-' + amount}</div>
  `;
  list.insertBefore(item, list.firstChild);
}

// ── AI Security Inspector Drawer ───────────────────────────────
function openInspector() {
  updateInspectorView();
  document.getElementById('inspector-drawer').style.display = 'flex';
}

function closeInspector() {
  document.getElementById('inspector-drawer').style.display = 'none';
}

function viewAuditDetails() {
  closeModal();
  openInspector();
}

function updateInspectorView() {
  const audit = state.last_audit_data;
  if (!audit) return;

  const risk = audit.overall_risk || 0;
  const scoreEl = document.getElementById('drawer-score');
  const verdictEl = document.getElementById('drawer-verdict');

  scoreEl.innerText = `${risk}/100`;
  verdictEl.innerText = audit.verdict || (risk >= 60 ? 'HIGH RISK' : 'APPROVED');

  if (risk >= 60) {
    scoreEl.style.color = '#ef4444';
  } else if (risk >= 30) {
    scoreEl.style.color = '#f59e0b';
  } else {
    scoreEl.style.color = '#10b981';
  }

  const results = audit.results || {};

  const map = [
    { key: 'image', bar: 'drawer-bar-vit', text: 'drawer-prob-vit' },
    { key: 'text', bar: 'drawer-bar-deberta', text: 'drawer-prob-deberta' },
    { key: 'transaction', bar: 'drawer-bar-ft', text: 'drawer-prob-ft' },
    { key: 'voice', bar: 'drawer-bar-whisper', text: 'drawer-prob-whisper' }
  ];

  map.forEach(m => {
    const res = results[m.key];
    const barEl = document.getElementById(m.bar);
    const textEl = document.getElementById(m.text);

    if (res && res.status !== 'Skipped') {
      const prob = (res.fraud_prob * 100).toFixed(0);
      barEl.style.width = `${prob}%`;
      barEl.style.backgroundColor = res.fraud_prob > 0.5 ? '#ef4444' : '#10b981';
      textEl.innerText = `${prob}% (${res.prediction})`;
      textEl.style.color = res.fraud_prob > 0.5 ? '#ef4444' : '#10b981';
    } else {
      barEl.style.width = '0%';
      textEl.innerText = 'Skipped / Low';
      textEl.style.color = '#64748b';
    }
  });
}

// ── Initial Boot ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  if (localStorage.getItem('neorisk-theme') === 'light') toggleTheme();
  const savedUser = sessionStorage.getItem('neorisk-user');
  if (savedUser) applyLoggedInUser(JSON.parse(savedUser));
  updatePayButton();

  // Fetch wallet state from backend
  try {
    const res = await fetch('/api/wallet');
    const data = await res.json();
    if (data.success) {
      state.wallet_balance = data.wallet.balance;
      document.getElementById('wallet-balance').innerText = `₹${data.wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      document.getElementById('header-upi').innerText = data.wallet.upi_id;
    }
  } catch (e) {
    console.warn('Could not sync initial wallet balance:', e);
  }
});
