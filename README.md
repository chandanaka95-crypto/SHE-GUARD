# 🌸 SHEGUARD – AI Women Safety Assistant

> **Tagline:** *Your Safety, Your Strength, Your Digital Guardian.*

SHEGUARD is a modern, full-stack, AI-powered women's safety web application designed to deliver real-time emergency assistance, tactical safety guidance, trusted contact management, live location sharing, threat/scam message detection, and situational escape tools.

Built with an **Apple & Linear-inspired glassmorphic interface**, SHEGUARD blends cutting-edge technology with high-reliability emergency tools suitable for commercial and engineering college mini-projects.

---

## 🌟 Key Features

### 1. 🏠 Home Safety Dashboard
- **Emergency SOS Centerpiece:** Prominent glowing, pulsating emergency SOS button with a 5-second cancelable countdown timer.
- **Direct National Emergency Hotlines:** 1-click speed dial buttons for **112 (National Emergency)**, **1091 (Women Helpline)**, **181 (Domestic Abuse)**, and **1930 (Cyber Crime)**.
- **Quick Access Tool Cards:** Seamless navigation to all critical modules.
- **Trusted Circle Quick Glance:** Instant WhatsApp and phone call triggers.
- **Situational Awareness Pro-Tip:** Daily tactical rule for solo commuters.

### 2. 🤖 AI Safety Chatbot (Powered by Google Gemini)
- Calm, practical, empathetic tactical guidance for distressing situations.
- Quick scenario chips:
  - *"Someone is following me."*
  - *"I am travelling alone."*
  - *"I need emergency help."*
  - *"I received a suspicious message."*
  - *"I feel unsafe in public."*
- **Text-to-Speech (TTS):** Hands-free audio readout of instructions so users don't have to look down at their phone while walking.
- **Explicit Safety Disclaimers:** Never pretends to replace direct 112 emergency calls.
- **Dual Engine:** Live Gemini API connectivity with an offline safety rules engine fallback.

### 3. 🚨 Emergency SOS System
- 5-second confirmation countdown with cancel option.
- Automatic acquisition of high-precision browser GPS coordinates (`navigator.geolocation`).
- Generates a shareable Google Maps location link.
- **Direct 1-Click Dispatch:** WhatsApp API and SMS links to all saved emergency contacts with the pre-formatted SOS distress message.
- Full logging of emergency alerts in SQLite database.
- **Emergency Audio Siren & Screen Strobe:** Web Audio API oscillator simulating a police/ambulance safety siren and visual flashing screen to attract public attention or disorient attackers.

### 4. 👥 Trusted Contacts Circle
- Add, edit, and delete contacts with relationship types (Mother, Father, Sister, Friend, etc.).
- Mark primary emergency contacts.
- Quick actions: Direct Phone Call (`tel:`), WhatsApp Chat (`wa.me`), and SMS (`sms:`).
- Stored permanently in SQLite (`database/safety.db`).

### 5. 📍 Live Location Sharing & Safe Radar
- Real-time GPS coordinate detection (latitude, longitude, accuracy radius, timestamp).
- Interactive **Leaflet.js + OpenStreetMap** visual radar map with glowing pulse marker.
- Reverse geocoding to approximate physical street address.
- 1-click Google Maps share link generator for easy copy/paste.
- Safe haven resource directory (Nearest Police Stations, Hospitals, Metro Hubs).

### 6. 🔍 Suspicious Message & Scam Detector
- Paste SMS, WhatsApp texts, emails, or direct messages.
- AI risk assessment with a calculated **Risk Score (0–100%)** and categorized risk badges (**Safe**, **Low**, **Suspicious**, **High Risk**, **Critical Threat**).
- Breakdown of detected red flags (urgency manipulation, OTP/PIN phishing, sextortion/blackmail, unverified links).
- Actionable protective recommendations and official reporting guidance (Cyber Crime 1930).
- Instant test sample presets for demonstration.

### 7. 📞 Fake Call Simulator
- Realistic smartphone incoming call screen (iOS / Android glass aesthetic).
- Configurable caller names (*"Mom"*, *"Dad"*, *"Police Inspector Sharma"*, *"Cab Driver"*).
- Timed delay triggers (Immediate, 5s, 15s, 30s, 60s).
- Realistic Web Audio ringtone tone (dual-frequency 440Hz + 480Hz cadence).
- Answer screen with live call timer and simulated spoken voiceline to gracefully exit uncomfortable situations.

### 8. 📚 Safety Awareness & Legal Rights Hub
- In-depth solo travel precautions, cab verification checklists, and anti-stalking rules.
- Women's legal rights: **Zero FIR**, sunset-to-sunrise arrest protections, confidentiality rights, and the PoSH Act.
- Verified national emergency contact directory.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, CSS3 (Glassmorphism & Micro-animations), JavaScript (ES6+), FontAwesome 6 |
| **Mapping** | Leaflet.js & OpenStreetMap (No API key required) |
| **Audio** | HTML5 Web Audio API (Synthesized Siren & Phone Ringtone) |
| **Speech** | Web Speech API (Text-to-Speech & Simulated Voice) |
| **Backend** | Python Flask (v3.1+) |
| **AI Integration** | Google Gemini API (`google-genai` SDK) |
| **Database** | SQLite3 (`database/safety.db`) |
| **Environment** | `python-dotenv` |

---

## 📁 Project Folder Structure

```
SHEGUARD/
├── app.py                     # Main Flask Backend & REST API routes
├── requirements.txt           # Python library dependencies
├── .env                       # Environment configuration & API key
├── README.md                  # Complete documentation
├── database/
│   └── safety.db              # SQLite Database (Contacts, SOS Logs, Settings)
├── static/
│   ├── style.css              # Glassmorphic Design System (Light/Dark themes)
│   ├── script.js              # Theme, Siren Audio, Global SOS, Strobe, Settings
│   └── safety.js              # Chatbot TTS, Leaflet GPS, Scam Detector, Fake Call
└── templates/
    ├── base.html              # Shell Layout, Navigation, Topbar, Modals
    ├── index.html             # Home Dashboard with Big SOS & Quick Cards
    ├── chatbot.html           # AI Safety Chatbot
    ├── contacts.html          # Trusted Contacts Manager
    ├── location.html          # Live Location Sharing & Interactive Map
    ├── scam_detector.html     # Suspicious Message & Scam Detector
    ├── safety.html            # Safety Awareness, Legal Rights & Helplines
    └── fake_call.html         # Fake Call Simulator & Smartphone Call Screen
```

---

## 🚀 How to Run the Application in VS Code

### Step 1: Open Project in VS Code
1. Open Visual Studio Code.
2. Click **File** &rarr; **Open Folder...** and select the `Cbot` or `SHEGUARD` folder.
3. Open the built-in terminal (**Ctrl + `** or **Terminal** &rarr; **New Terminal**).

### Step 2: Install Dependencies
Ensure Python 3.10+ is installed on your system. Run:
```bash
pip install -r requirements.txt
```

### Step 3: Configure Gemini API Key (Optional but Recommended)
1. Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. Open the `.env` file in the project root and paste your key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
3. *Alternatively, you can also paste your API key directly inside the web interface by clicking the **Settings** (⚙️) gear icon in the top header.*
4. *(Note: If you do not have an API key right now, SHEGUARD's intelligent offline safety engine will automatically provide realistic, tactical safety guidance for all features!)*

### Step 4: Run the Flask Application
In the VS Code terminal, execute:
```bash
python app.py
```

You will see:
```
==================================================
🌸 SHEGUARD – AI Women Safety Assistant Running
👉 Local Web Access: http://127.0.0.1:5000
🛡️ Tagline: Your Safety, Your Strength, Your Digital Guardian.
==================================================
```

### Step 5: Open in Your Browser
Open your browser (Chrome, Edge, Firefox, or Safari) and navigate to:
```
http://127.0.0.1:5000
```

---

## 🧪 Testing the Features

1. **Dashboard SOS:** Click the large red **SOS** button. Watch the 5-second countdown timer. Click **Send NOW** to acquire GPS coordinates and generate WhatsApp/SMS alerts for contacts.
2. **AI Safety Chatbot:** Navigate to **AI Safety Chatbot**. Click on quick prompt chips like *"Someone is following me"* or *"I am travelling alone"*. Click the speaker icon to hear the audio readout!
3. **Emergency Siren & Strobe:** Click the megaphone/speaker icon in the top-right header to activate the loud emergency siren and visual strobe screen.
4. **Live Location:** Go to **Location Sharing**. Allow browser location permission to see your live position pinned on the Leaflet map with radius circle. Click **Copy Link** or **Share on WhatsApp**.
5. **Scam Detector:** Open **Scam Detector**. Click on one of the sample buttons (e.g., *"Bank KYC Scam"* or *"Cyber Extortion"*), then click **Run AI Security Scan** to view the risk score and red flags report.
6. **Fake Call:** Open **Fake Call**, choose a caller name like *"Mom"*, set delay to **Immediate**, and click **Activate Fake Call Simulation**. Watch the incoming call screen, listen to the ringtone, click **Accept** to see the timer and hear the simulated speaker voice!
7. **Trusted Contacts:** Go to **Trusted Contacts**, add a new contact with phone number and relationship, edit details, or test direct call/WhatsApp triggers.
8. **Dark / Light Mode:** Click the sun/moon button in the top navigation bar to toggle between themes with persistent glassmorphism styling.

---

## 🔒 Security & Privacy Practices
- **No Hardcoded API Keys:** Loaded securely via `.env` or stored locally in encrypted SQLite settings.
- **Permission Safeguards:** Location is requested solely upon user initiation using the official HTML5 Geolocation API.
- **Honest Dispatch Reporting:** The application transparently indicates whether an alert was prepared on the device for dispatch rather than making false claims.
- **Client-Side Synthesis:** Audio sirens, ringtones, and TTS utilize native Web Audio and Web Speech APIs without requiring external audio server downloads.

---

*SHEGUARD – Your Safety, Your Strength, Your Digital Guardian.*
