"""
SHEGUARD – AI Women Safety Assistant
Backend Application (Flask + SQLite + Google Gemini API)
Tagline: Your Safety, Your Strength, Your Digital Guardian.
"""

import os
import json
import sqlite3
import datetime
from flask import Flask, render_template, request, jsonify, redirect, url_for
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'sheguard-safety-default-key-2026')

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database', 'safety.db')

# Ensure database directory exists
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)


# ==========================================
# DATABASE INITIALIZATION & HELPERS
# ==========================================
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Contacts table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            relationship TEXT,
            is_primary INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # SOS incident logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sos_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            latitude REAL,
            longitude REAL,
            accuracy REAL,
            address TEXT,
            status TEXT,
            message TEXT
        )
    ''')

    # App Settings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')

    # Seed default contacts if empty
    cursor.execute('SELECT COUNT(*) FROM contacts')
    count = cursor.fetchone()[0]
    if count == 0:
        sample_contacts = [
            ('Mom', '+919876543210', 'Mother', 1),
            ('Priya Sharma', '+919876543211', 'Sister / Roommate', 0),
            ('Emergency Helpline', '112', 'National Emergency Police', 0)
        ]
        cursor.executemany(
            'INSERT INTO contacts (name, phone, relationship, is_primary) VALUES (?, ?, ?, ?)',
            sample_contacts
        )

    # Seed default SOS template if not exists
    cursor.execute('SELECT value FROM settings WHERE key = ?', ('sos_template',))
    if not cursor.fetchone():
        default_template = (
            "EMERGENCY ALERT from SHEGUARD! I feel unsafe and require immediate assistance. "
            "My current live location is: {location_url} (Lat: {lat}, Lng: {lng}). "
            "Please check on me immediately or contact 112 emergency services."
        )
        cursor.execute('INSERT INTO settings (key, value) VALUES (?, ?)', ('sos_template', default_template))

    conn.commit()
    conn.close()


init_db()


def get_gemini_api_key():
    """Retrieve Gemini API key from database setting or environment variable."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT value FROM settings WHERE key = ?', ('gemini_api_key',))
    row = cursor.fetchone()
    conn.close()
    if row and row['value']:
        return row['value'].strip()
    return os.getenv('GEMINI_API_KEY', '').strip()


# ==========================================
# GEMINI AI CLIENT & SAFETY ENGINE
# ==========================================
def call_gemini(prompt: str, system_instruction: str = "") -> str:
    """Calls Google Gemini API using google-genai library if key is available."""
    api_key = get_gemini_api_key()
    if not api_key:
        raise ValueError("NO_API_KEY")

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)
        
        # Configure model request with safety prompt
        config = types.GenerateContentConfig(
            system_instruction=system_instruction if system_instruction else None,
            temperature=0.3,
            max_output_tokens=1000
        )
        
        # Try gemini-2.5-flash, fallback to gemini-1.5-flash
        model_name = "gemini-2.5-flash"
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config
            )
            return response.text
        except Exception:
            # Fallback model attempt
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt,
                config=config
            )
            return response.text

    except Exception as e:
        raise RuntimeError(f"Gemini API Error: {str(e)}")


def intelligent_safety_fallback(user_message: str) -> str:
    """
    Intelligent, rule-based women safety guidelines engine
    that responds safely and calmly when Gemini API key is not yet configured.
    """
    msg = user_message.lower()

    if any(k in msg for k in ['follow', 'following', 'behind me', 'stalk', 'someone is behind']):
        return (
            "🚨 **IMMEDIATE ACTION PROTOCOL: Someone Is Following You**\n\n"
            "1. **Do not go home or into isolated alleys.** Heading home reveals your address.\n"
            "2. **Cross the street immediately.** If the person also crosses, you have confirmed suspicion.\n"
            "3. **Head directly into a crowded, well-lit place.** Enter a shop, restaurant, pharmacy, metro station, or hotel lobby.\n"
            "4. **Pretend you are on a live phone call or call someone right now.** Say loudly: *'Yes, I can see you, I am right outside the store waiting for you!'*\n"
            "5. **Inform staff or security immediately.** Tell the store manager: *'Someone is following me outside, please help me call security or police.'*\n"
            "6. **Trigger the SHEGUARD SOS button or dial 112.** If you feel immediate danger, shout *'FIRE!'* or *'HELP!'* to attract maximum public attention."
        )

    elif any(k in msg for k in ['alone', 'travel', 'travelling', 'traveling', 'night', 'walk', 'dark', 'commute']):
        return (
            "🛡️ **SAFE TRAVEL PROTOCOL: Solo Journey Guidelines**\n\n"
            "1. **Share Your Live GPS Location:** Use SHEGUARD's *Location Sharing* or WhatsApp Live Location with a family member.\n"
            "2. **Keep One Ear Free:** Never wear noise-cancelling headphones in both ears while walking alone at night. Stay aware of footsteps and vehicle sounds.\n"
            "3. **Verify Hired Cabs / Autos:** Check the license plate before boarding. Verify child locks are disengaged. Share the driver's details and vehicle number with a contact.\n"
            "4. **Walk with Confident Posture:** Head high, firm pace, eyes scanning ahead. Avoid looking down at your phone continuously.\n"
            "5. **Have Emergency Numbers on Speed Dial:** Keep your thumb close to your phone's power button (multi-press emergency SOS) or SHEGUARD's SOS button.\n"
            "6. **If a Vehicle Follows You:** Turn around and walk in the opposite direction. A car cannot reverse as quickly as it can follow forward."
        )

    elif any(k in msg for k in ['emergency', 'danger', 'attack', 'threat', 'help me', 'hurt', 'police']):
        return (
            "⚠️ **CRITICAL EMERGENCY GUIDANCE: Immediate Danger**\n\n"
            "1. **DIAL 112 IMMEDIATELY.** National Emergency Helpline operates 24/7 with highest priority.\n"
            "2. **Tap the Red SOS Button on SHEGUARD.** Send your real-time coordinates instantly to your trusted contacts.\n"
            "3. **Run toward lights, people, or traffic.** Do not hesitate to run into the middle of a busy road or commercial store.\n"
            "4. **Make Maximum Noise.** Scream, blow a safety whistle, or activate the SHEGUARD Siren tool to disorient the attacker.\n"
            "5. **Physical Defense Target Areas:** If grabbed, strike vulnerable points: eyes, nose bridge, throat, groin, or instep stomp on the foot.\n\n"
            "*(Reminder: SHEGUARD provides tactical safety advice. You must contact emergency services 112 for direct dispatch.)*"
        )

    elif any(k in msg for k in ['suspicious', 'message', 'text', 'scam', 'blackmail', 'link', 'photo', 'harass']):
        return (
            "🔍 **CYBER SAFETY PROTOCOL: Suspicious / Threatening Message**\n\n"
            "1. **DO NOT CLICK ANY LINKS OR ATTACHMENTS.** Malicious links can install spyware or steal OTPs.\n"
            "2. **DO NOT DELETE THE EVIDENCE.** Take clear screenshots showing the sender's phone number, username, timestamps, and message contents.\n"
            "3. **Do Not Engage, Argue, or Pay.** Blackmailers escalate demands once you comply. Cut off communication.\n"
            "4. **Use SHEGUARD's Scam Detector.** Paste the text into our *Scam Detector* page to scan for known fraud and blackmail patterns.\n"
            "5. **Report to Cyber Crime Cell:** Dial **1930** (National Cyber Crime Helpline) or report securely at cybercrime.gov.in."
        )

    elif any(k in msg for k in ['public', 'bus', 'train', 'metro', 'crowd', 'cab', 'taxi', 'uber', 'auto']):
        return (
            "🚍 **PUBLIC TRANSIT SAFETY CHECKLIST**\n\n"
            "1. **Sit Near Drivers / Conductors or Women's Coaches:** In metro trains or buses, stay in designated women's compartments or near the driver.\n"
            "2. **Keep Bags in Front of You:** Protect your personal space and guard against pickpockets or unwanted proximity.\n"
            "3. **Call Out Unwanted Touching Firmly:** Use a loud, clear, assertive voice: *'Step back! Do not touch me.'* Public shaming immediately deters 90% of harassers.\n"
            "4. **Fake Call Simulator:** If someone is staring or making you uncomfortable, activate the SHEGUARD *Fake Call Simulator* to simulate an imminent pickup conversation."
        )

    else:
        return (
            "🌸 **SHEGUARD AI Safety Assistant**\n\n"
            "I am here to guide and protect you. Here are key safety practices right now:\n\n"
            "• **Assess your surroundings:** Stay in illuminated areas with visible people or CCTV cameras.\n"
            "• **Share your whereabouts:** Keep a trusted contact informed of your destination and expected arrival time.\n"
            "• **Trust your gut feeling:** If an intuition tells you a situation feels wrong, leave immediately without apologizing.\n"
            "• **Emergency Helplines:**\n"
            "  - **112**: All-in-one Emergency (Police, Fire, Ambulance)\n"
            "  - **1091**: Women's Helpline (Special Squad)\n"
            "  - **181**: Women in Distress / Domestic Abuse\n"
            "  - **1930**: National Cyber Crime Reporting\n\n"
            "*How can I assist you right now? Describe what you are experiencing.*"
        )


# ==========================================
# PAGE ROUTES
# ==========================================
@app.route('/')
def home():
    """Home Dashboard"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM contacts ORDER BY is_primary DESC, id ASC LIMIT 4')
    contacts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return render_template('index.html', contacts=contacts)


@app.route('/chatbot')
def chatbot():
    """AI Safety Chatbot Page"""
    has_api_key = bool(get_gemini_api_key())
    return render_template('chatbot.html', has_api_key=has_api_key)


@app.route('/contacts')
def contacts_page():
    """Trusted Contacts Management Page"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM contacts ORDER BY is_primary DESC, id ASC')
    contacts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return render_template('contacts.html', contacts=contacts)


@app.route('/location')
def location_page():
    """Live Location Sharing Page"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM contacts ORDER BY is_primary DESC, id ASC')
    contacts = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return render_template('location.html', contacts=contacts)


@app.route('/scam-detector')
def scam_detector_page():
    """Suspicious Message & Scam Detector Page"""
    has_api_key = bool(get_gemini_api_key())
    return render_template('scam_detector.html', has_api_key=has_api_key)


@app.route('/safety')
def safety_page():
    """Safety Awareness & Knowledge Base Page"""
    return render_template('safety.html')


@app.route('/fake-call')
def fake_call_page():
    """Simulated Incoming Call Page"""
    return render_template('fake_call.html')


# ==========================================
# REST API ENDPOINTS
# ==========================================

# 1. AI Safety Chat API
@app.route('/api/chat', methods=['POST'])
def api_chat():
    data = request.get_json() or {}
    user_message = data.get('message', '').strip()

    if not user_message:
        return jsonify({'error': 'Message cannot be empty.'}), 400

    system_instruction = (
        "You are SHEGUARD AI, an empathetic, hyper-vigilant, calm, practical, and highly trained women's safety advisor. "
        "Your top priority is the user's immediate physical, emotional, and digital safety. "
        "Guidelines:\n"
        "1. Provide calm, direct, actionable, step-by-step guidance formatted with bold headers and bullet points.\n"
        "2. Prioritize tactical self-preservation: reaching safe illuminated spaces, making noise, informing people around, sharing live GPS, setting boundaries.\n"
        "3. NEVER pretend that you or the system have contacted emergency services or police for them. Clearly state that they must dial 112 if in direct danger.\n"
        "4. Keep advice concise, practical, and readable under high-stress conditions.\n"
        "5. Conclude with emergency hotline reminders (112 / 1091) when relevant."
    )

    api_key = get_gemini_api_key()
    ai_active = bool(api_key)

    try:
        if api_key:
            reply = call_gemini(user_message, system_instruction)
        else:
            reply = intelligent_safety_fallback(user_message)
    except Exception as e:
        # Graceful fallback to safety rules engine on API error
        reply = intelligent_safety_fallback(user_message)
        reply += f"\n\n*(Note: Live Gemini AI connection encountered: {str(e)}. Switched to offline safety protocol.)*"

    return jsonify({
        'reply': reply,
        'ai_active': ai_active,
        'timestamp': datetime.datetime.now().strftime('%H:%M')
    })


# 2. Suspicious Message & Scam Analysis API
@app.route('/api/analyze-message', methods=['POST'])
def api_analyze_message():
    data = request.get_json() or {}
    message_text = data.get('message', '').strip()

    if not message_text:
        return jsonify({'error': 'Please enter a message to analyze.'}), 400

    api_key = get_gemini_api_key()
    ai_active = bool(api_key)

    analysis_prompt = f"""
    Analyze the following SMS / WhatsApp / email message for safety risks against women, scam indicators, extortion, blackmail, phishing, impersonation, or threatening language.
    
    Message Content:
    \"\"\"{message_text}\"\"\"

    Return ONLY a valid JSON object matching this schema (no markdown formatting, no backticks):
    {{
        "risk_level": "Safe" | "Low" | "Suspicious" | "High Risk" | "Critical Threat",
        "risk_score": 15,
        "summary": "Short 1-2 sentence executive summary of what this message appears to be.",
        "red_flags": ["List item 1", "List item 2"],
        "threat_type": "Financial Phishing / Extortion / Harassment / Safe / Spam",
        "recommendations": ["Do not click links", "Block number", "Report to 1930"]
    }}
    """

    if api_key:
        try:
            raw_result = call_gemini(analysis_prompt, "You are a cybersecurity and threat intelligence expert for women's personal safety.")
            # Clean markdown codeblocks if returned
            clean_json = raw_result.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.startswith("```"):
                clean_json = clean_json[3:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            clean_json = clean_json.strip()
            result = json.loads(clean_json)
        except Exception:
            result = fallback_scam_analysis(message_text)
    else:
        result = fallback_scam_analysis(message_text)

    return jsonify({
        'analysis': result,
        'ai_active': ai_active
    })


def fallback_scam_analysis(text: str) -> dict:
    """Intelligent fallback scam and threat heuristic evaluator."""
    lower = text.lower()
    score = 10
    flags = []
    threat_type = "Informational / Standard"
    level = "Safe"
    recommendations = ["Always verify sender identity through official channels."]

    # Checks
    if any(k in lower for k in ['otp', 'one time password', 'pin', 'cvv', 'password']):
        score += 40
        flags.append("Requests confidential authentication details (OTP/PIN/Password).")
        threat_type = "Credential Phishing / Banking Fraud"

    if any(k in lower for k in ['http://', 'https://', 'bit.ly', 'tinyurl', '.apk', 'click here', 'link']):
        score += 25
        flags.append("Contains unverified links or software download prompt.")

    if any(k in lower for k in ['urgent', 'immediately', 'suspended', 'blocked', 'account will be', 'within 2 hours', 'warning']):
        score += 20
        flags.append("Employs psychological urgency and fear tactics.")

    if any(k in lower for k in ['lottery', 'winner', 'won', 'cash prize', 'gift card', 'claim prize', 'job offer', 'earn 5000']):
        score += 30
        flags.append("Unsolicited monetary gain or fake high-paying job lure.")
        threat_type = "Financial Advance Fee Scam"

    if any(k in lower for k in ['photos', 'video', 'leak', 'blackmail', 'ruin your life', 'send money or', 'recorded you', 'webcam']):
        score = max(score, 90)
        flags.append("Severe extortion / sextortion or reputation threat detected.")
        threat_type = "Cyber Extortion & Blackmail Threat"

    if any(k in lower for k in ['kill', 'harm', 'find you', 'know where you live', 'hurt you']):
        score = 98
        flags.append("Explicit violent or physical threat detected.")
        threat_type = "Direct Physical Threat / Harassment"

    score = min(score, 100)
    if score >= 85:
        level = "Critical Threat"
        recommendations = [
            "DO NOT reply or send any money/photos.",
            "Take full screenshots including timestamps and phone number.",
            "Dial 1930 (Cyber Crime Helpline) or 112 if immediate physical danger.",
            "Block the sender and report the account."
        ]
    elif score >= 60:
        level = "High Risk"
        recommendations = [
            "Do not click any embedded links or download attachments.",
            "Never share OTPs, bank details, or personal data.",
            "Block and report the sender."
        ]
    elif score >= 35:
        level = "Suspicious"
        recommendations = [
            "Exercise caution. Verify the company via their official website.",
            "Do not share personal details."
        ]
    else:
        level = "Safe"
        recommendations = [
            "No immediate high-risk threat patterns detected.",
            "Continue exercising standard digital vigilance."
        ]

    return {
        "risk_level": level,
        "risk_score": score,
        "summary": f"Analyzed message with identified risk level: {level}.",
        "red_flags": flags if flags else ["No overt high-risk scam triggers identified."],
        "threat_type": threat_type,
        "recommendations": recommendations
    }


# 3. Trusted Contacts CRUD APIs
@app.route('/api/contacts', methods=['GET', 'POST'])
def api_contacts():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        cursor.execute('SELECT * FROM contacts ORDER BY is_primary DESC, id ASC')
        contacts = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify({'contacts': contacts})

    elif request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        phone = data.get('phone', '').strip()
        relationship = data.get('relationship', 'Friend').strip()
        is_primary = 1 if data.get('is_primary') else 0

        if not name or not phone:
            conn.close()
            return jsonify({'error': 'Name and phone number are required.'}), 400

        # If primary, unmark others
        if is_primary:
            cursor.execute('UPDATE contacts SET is_primary = 0')

        cursor.execute(
            'INSERT INTO contacts (name, phone, relationship, is_primary) VALUES (?, ?, ?, ?)',
            (name, phone, relationship, is_primary)
        )
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return jsonify({'success': True, 'id': new_id, 'message': 'Contact added successfully.'}), 201


@app.route('/api/contacts/<int:contact_id>', methods=['PUT', 'DELETE'])
def api_contact_detail(contact_id):
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'PUT':
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        phone = data.get('phone', '').strip()
        relationship = data.get('relationship', '').strip()
        is_primary = 1 if data.get('is_primary') else 0

        if not name or not phone:
            conn.close()
            return jsonify({'error': 'Name and phone number are required.'}), 400

        if is_primary:
            cursor.execute('UPDATE contacts SET is_primary = 0')

        cursor.execute(
            'UPDATE contacts SET name = ?, phone = ?, relationship = ?, is_primary = ? WHERE id = ?',
            (name, phone, relationship, is_primary, contact_id)
        )
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Contact updated successfully.'})

    elif request.method == 'DELETE':
        cursor.execute('DELETE FROM contacts WHERE id = ?', (contact_id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Contact deleted successfully.'})


# 4. Emergency SOS Trigger API
@app.route('/api/sos/trigger', methods=['POST'])
def api_sos_trigger():
    data = request.get_json() or {}
    lat = data.get('latitude')
    lng = data.get('longitude')
    accuracy = data.get('accuracy', 0)
    address = data.get('address', 'Unknown Location')

    conn = get_db()
    cursor = conn.cursor()

    # Retrieve SOS template
    cursor.execute('SELECT value FROM settings WHERE key = ?', ('sos_template',))
    row = cursor.fetchone()
    template = row['value'] if row else "EMERGENCY! I need help. Location: {location_url}"

    # Generate shareable map links
    if lat and lng:
        location_url = f"https://www.google.com/maps?q={lat},{lng}"
        formatted_message = template.format(
            location_url=location_url,
            lat=f"{lat:.5f}",
            lng=f"{lng:.5f}"
        )
    else:
        location_url = "Location coordinates unavailable"
        formatted_message = "EMERGENCY ALERT from SHEGUARD! I feel unsafe and require immediate assistance. Please contact 112 emergency services."

    # Fetch all contacts to notify
    cursor.execute('SELECT * FROM contacts ORDER BY is_primary DESC, id ASC')
    contacts = [dict(c) for c in cursor.fetchall()]

    # Log the SOS event in database
    cursor.execute(
        'INSERT INTO sos_logs (latitude, longitude, accuracy, address, status, message) VALUES (?, ?, ?, ?, ?, ?)',
        (lat, lng, accuracy, address, 'DISPATCHED_TO_DEVICE', formatted_message)
    )
    conn.commit()
    log_id = cursor.lastrowid
    conn.close()

    return jsonify({
        'success': True,
        'log_id': log_id,
        'message_template': formatted_message,
        'location_url': location_url,
        'contacts': contacts,
        'police_number': '112',
        'status': 'READY_TO_DISPATCH',
        'timestamp': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    })


# 5. Settings API (Gemini API Key, Custom SOS Template)
@app.route('/api/settings', methods=['GET', 'POST'])
def api_settings():
    conn = get_db()
    cursor = conn.cursor()

    if request.method == 'GET':
        cursor.execute('SELECT key, value FROM settings')
        settings = {row['key']: row['value'] for row in cursor.fetchall()}
        # Mask API key if present
        api_key = get_gemini_api_key()
        masked_key = (api_key[:4] + '...' + api_key[-4:]) if len(api_key) > 8 else (bool(api_key) * '••••••••')
        conn.close()
        return jsonify({
            'has_gemini_key': bool(api_key),
            'masked_key': masked_key,
            'sos_template': settings.get('sos_template', '')
        })

    elif request.method == 'POST':
        data = request.get_json() or {}
        new_key = data.get('gemini_api_key')
        sos_template = data.get('sos_template')

        if new_key is not None:
            new_key = new_key.strip()
            cursor.execute(
                'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
                ('gemini_api_key', new_key, new_key)
            )

        if sos_template is not None:
            sos_template = sos_template.strip()
            cursor.execute(
                'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?',
                ('sos_template', sos_template, sos_template)
            )

        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Settings saved successfully.'})


# 6. Helplines Directory API
@app.route('/api/helplines', methods=['GET'])
def api_helplines():
    helplines = [
        {"name": "National Emergency Number", "number": "112", "desc": "All-in-one Police, Fire & Ambulance response", "badge": "24/7 Primary"},
        {"name": "Women Helpline", "number": "1091", "desc": "Dedicated national women emergency response", "badge": "Police Squad"},
        {"name": "Women in Distress / Domestic Abuse", "number": "181", "desc": "Support, shelter, counselling & legal aid", "badge": "Toll Free"},
        {"name": "National Cyber Crime Helpline", "number": "1930", "desc": "Reporting online harassment, financial fraud, blackmail", "badge": "Cyber Unit"},
        {"name": "National Commission for Women (NCW)", "number": "7827170170", "desc": "24/7 Violence against women helpline", "badge": "Legal Aid"},
        {"name": "Childline Emergency", "number": "1098", "desc": "Protection for minors and young girls", "badge": "24/7 Support"}
    ]
    return jsonify({'helplines': helplines})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'
    print(f"==================================================")
    print(f"🌸 SHEGUARD – AI Women Safety Assistant Running")
    print(f"👉 Local Web Access: http://127.0.0.1:{port}")
    print(f"🛡️ Tagline: Your Safety, Your Strength, Your Digital Guardian.")
    print(f"==================================================")
    app.run(host='0.0.0.0', port=port, debug=debug)
