import requests
import threading
import time
import json
import logging

TOKEN = '8943677394:AAEBoFXNqbMLeGU-hAyAhVCfjIpp97q5pFg'
CHAT_ID = '5738462975'
BASE_URL = f'https://api.telegram.org/bot{TOKEN}'

# Thread-safe dictionary to track pending transactions
# Format: { tx_id: "PENDING" | "APPROVED" | "DECLINED" }
PENDING_TRANSACTIONS = {}
_lock = threading.Lock()

def set_transaction_status(tx_id, status):
    with _lock:
        PENDING_TRANSACTIONS[tx_id] = status

def get_transaction_status(tx_id):
    with _lock:
        return PENDING_TRANSACTIONS.get(tx_id, None)

def init_transaction(tx_id):
    with _lock:
        PENDING_TRANSACTIONS[tx_id] = "PENDING"

def send_alert(amount, recipient_name, risk_score):
    """Send a severe alert for extremely large/high-risk transactions."""
    text = (
        f"🚨 *SEVERE SECURITY ALERT* 🚨\n\n"
        f"A massive transaction was just attempted on your NeoRisk account.\n"
        f"💰 *Amount:* ₹{amount:,.2f}\n"
        f"👤 *Recipient:* {recipient_name}\n"
        f"⚠️ *Risk Score:* {risk_score}%\n\n"
        f"We are monitoring this closely. If this wasn't you, please contact your bank immediately."
    )
    url = f"{BASE_URL}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": text,
        "parse_mode": "Markdown"
    }
    try:
        requests.post(url, json=payload)
    except Exception as e:
        print(f"[Telegram Alert Error]: {e}")

def send_auth_request(tx_id, amount, recipient_name):
    """Send an interactive authorization request."""
    init_transaction(tx_id)
    text = (
        f"🔐 *NEORISK AUTHORIZATION REQUIRED* 🔐\n\n"
        f"You are trying to send a large amount.\n"
        f"💰 *Amount:* ₹{amount:,.2f}\n"
        f"👤 *Recipient:* {recipient_name}\n\n"
        f"Please confirm if you want to proceed with this payment."
    )
    
    # Inline keyboard
    keyboard = {
        "inline_keyboard": [
            [
                {"text": "✅ Accept", "callback_data": f"accept_{tx_id}"},
                {"text": "❌ Decline", "callback_data": f"decline_{tx_id}"}
            ]
        ]
    }
    
    url = f"{BASE_URL}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": text,
        "parse_mode": "Markdown",
        "reply_markup": json.dumps(keyboard)
    }
    try:
        requests.post(url, json=payload)
    except Exception as e:
        print(f"[Telegram Auth Error]: {e}")


def poll_updates():
    """Background thread to poll for inline keyboard clicks."""
    offset = None
    while True:
        try:
            url = f"{BASE_URL}/getUpdates"
            params = {"timeout": 30}
            if offset:
                params["offset"] = offset
            
            resp = requests.get(url, params=params, timeout=35)
            if resp.status_code == 200:
                data = resp.json()
                for item in data.get("result", []):
                    offset = item["update_id"] + 1
                    
                    if "callback_query" in item:
                        cq = item["callback_query"]
                        cq_id = cq["id"]
                        data_str = cq.get("data", "")
                        
                        if data_str.startswith("accept_"):
                            tx_id = data_str.replace("accept_", "")
                            set_transaction_status(tx_id, "APPROVED")
                            # Answer callback query to remove loading state on button
                            requests.post(f"{BASE_URL}/answerCallbackQuery", json={"callback_query_id": cq_id, "text": "Payment Approved!"})
                            
                        elif data_str.startswith("decline_"):
                            tx_id = data_str.replace("decline_", "")
                            set_transaction_status(tx_id, "DECLINED")
                            requests.post(f"{BASE_URL}/answerCallbackQuery", json={"callback_query_id": cq_id, "text": "Payment Declined!"})
                            
        except Exception as e:
            print(f"[Telegram Polling Error]: {e}")
            time.sleep(5)
            
        time.sleep(1)

# Start the polling thread when the module is imported
polling_thread = threading.Thread(target=poll_updates, daemon=True)
polling_thread.start()
