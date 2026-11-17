/**
 * SHEGUARD – AI Women Safety Assistant
 * Feature-Specific Modules: Chatbot, Location Sharing, Scam Detector, Contacts, Fake Call
 */

// ===================================================================
// MODULE 1: AI SAFETY CHATBOT
// ===================================================================
let speechSynth = window.speechSynthesis;
let currentUtterance = null;

function initChatbot() {
    const chatInput = document.getElementById('chat-user-input');
    const sendBtn = document.getElementById('chat-send-btn');
    const promptsWrapper = document.getElementById('chat-quick-prompts');

    if (!chatInput || !sendBtn) return;

    sendBtn.addEventListener('click', handleChatSubmit);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChatSubmit();
        }
    });

    if (promptsWrapper) {
        promptsWrapper.addEventListener('click', (e) => {
            const chip = e.target.closest('.prompt-chip');
            if (chip) {
                const text = chip.getAttribute('data-prompt') || chip.innerText.trim();
                chatInput.value = text;
                handleChatSubmit();
            }
        });
    }

    console.log("💬 AI Safety Chatbot module initialized.");
}

async function handleChatSubmit() {
    const chatInput = document.getElementById('chat-user-input');
    const messagesArea = document.getElementById('chat-messages-area');
    const sendBtn = document.getElementById('chat-send-btn');

    if (!chatInput || !messagesArea) return;

    const userText = chatInput.value.trim();
    if (!userText) return;

    // Append user message bubble
    appendChatBubble('user', userText);
    chatInput.value = '';
    sendBtn.disabled = true;

    // Append typing indicator
    const typingId = appendTypingIndicator();
    messagesArea.scrollTop = messagesArea.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userText })
        });

        const data = await response.json();
        removeTypingIndicator(typingId);

        if (response.ok && data.reply) {
            appendChatBubble('bot', data.reply, data.timestamp);
        } else {
            appendChatBubble('bot', '⚠️ ' + (data.error || 'Unable to connect to safety assistant. Please try again or dial 112 if in direct danger.'));
        }
    } catch (err) {
        removeTypingIndicator(typingId);
        appendChatBubble('bot', '⚠️ Connection error: ' + err.message + '\n\nIf you are in immediate danger, please dial **112** without hesitation.');
    } finally {
        sendBtn.disabled = false;
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
}

function appendChatBubble(role, rawContent, timestamp = null) {
    const messagesArea = document.getElementById('chat-messages-area');
    if (!messagesArea) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;

    const formattedTime = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let avatarHtml = role === 'bot'
        ? `<div class="chat-avatar" style="width: 38px; height: 38px; font-size: 1rem;"><i class="fas fa-shield-cat"></i></div>`
        : `<div class="chat-avatar" style="width: 38px; height: 38px; font-size: 1rem; background: var(--cyan-gradient);"><i class="fas fa-user"></i></div>`;

    let actionsHtml = role === 'bot' ? `
        <div class="bubble-actions">
            <button class="bubble-action-btn" title="Listen voice" onclick="speakText(this)">
                <i class="fas fa-volume-up"></i>
            </button>
            <button class="bubble-action-btn" title="Copy text" onclick="copyBubbleText(this)">
                <i class="far fa-copy"></i>
            </button>
        </div>
    ` : '';

    const htmlContent = formatChatMarkdown(rawContent);

    bubble.innerHTML = `
        ${avatarHtml}
        <div style="flex: 1;">
            <div class="bubble-content">${htmlContent}</div>
            <div class="bubble-meta">
                <span>${formattedTime}</span>
                ${actionsHtml}
            </div>
        </div>
    `;

    messagesArea.appendChild(bubble);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function formatChatMarkdown(text) {
    if (!text) return '';
    // Format bold, italics, bullet points, numbered lists
    let clean = escapeHtml(text);
    clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    clean = clean.replace(/\*(.*?)\*/g, '<em>$1</em>');
    clean = clean.replace(/`([^`]+)`/g, '<code>$1</code>');
    clean = clean.replace(/\n\n/g, '<br><br>');
    clean = clean.replace(/\n• (.*?)/g, '<br>&bull; $1');
    clean = clean.replace(/\n([0-9]+)\. (.*?)/g, '<br><strong>$1.</strong> $2');
    clean = clean.replace(/\n/g, '<br>');
    return clean;
}

function appendTypingIndicator() {
    const messagesArea = document.getElementById('chat-messages-area');
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'chat-bubble bot';
    div.innerHTML = `
        <div class="chat-avatar" style="width: 38px; height: 38px; font-size: 1rem;"><i class="fas fa-shield-cat"></i></div>
        <div class="typing-bubble">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    messagesArea.appendChild(div);
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function speakText(btn) {
    if (!speechSynth) {
        showToast('Text-to-speech not supported in this browser.', 'error');
        return;
    }

    if (speechSynth.speaking) {
        speechSynth.cancel();
        btn.innerHTML = '<i class="fas fa-volume-up"></i>';
        return;
    }

    const bubbleContent = btn.closest('.chat-bubble').querySelector('.bubble-content');
    if (!bubbleContent) return;

    const rawText = bubbleContent.innerText;
    currentUtterance = new SpeechSynthesisUtterance(rawText);
    currentUtterance.rate = 0.95;
    currentUtterance.pitch = 1.0;

    btn.innerHTML = '<i class="fas fa-stop" style="color: var(--sos-red);"></i>';

    currentUtterance.onend = () => {
        btn.innerHTML = '<i class="fas fa-volume-up"></i>';
    };
    currentUtterance.onerror = () => {
        btn.innerHTML = '<i class="fas fa-volume-up"></i>';
    };

    speechSynth.speak(currentUtterance);
}

function copyBubbleText(btn) {
    const bubbleContent = btn.closest('.chat-bubble').querySelector('.bubble-content');
    if (!bubbleContent) return;
    navigator.clipboard.writeText(bubbleContent.innerText);
    showToast('Safety advice copied to clipboard!', 'success');
}

function clearChatMessages() {
    const messagesArea = document.getElementById('chat-messages-area');
    if (messagesArea) {
        messagesArea.innerHTML = '';
        appendChatBubble('bot', "🌸 **SHEGUARD AI Active.** How can I assist you with your safety right now? Tap any quick prompt below or describe your situation.");
        showToast('Chat history cleared.', 'info');
    }
}


// ===================================================================
// MODULE 2: LIVE LOCATION SHARING (LEAFLET + GEOLOCATION)
// ===================================================================
let leafletMap = null;
let userMarker = null;
let accuracyCircle = null;
let currentCoords = null;

function initLocationModule() {
    const mapEl = document.getElementById('leaflet-map');
    if (!mapEl) return;

    // Initialize Leaflet map with default fallback (New Delhi coordinates)
    const defaultLat = 28.6139;
    const defaultLng = 77.2090;

    leafletMap = L.map('leaflet-map', {
        zoomControl: true,
        attributionControl: false
    }).setView([defaultLat, defaultLng], 14);

    // Dark styled OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
    }).addTo(leafletMap);

    requestUserLiveLocation();
}

function requestUserLiveLocation() {
    const statusText = document.getElementById('location-status-text');
    if (statusText) statusText.innerText = "Requesting GPS permission...";

    if (!navigator.geolocation) {
        showToast("Geolocation is not supported by your browser.", "error");
        if (statusText) statusText.innerText = "Geolocation not supported";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            handleLocationSuccess(pos.coords);
        },
        (err) => {
            console.warn("Geolocation Error:", err);
            showToast("Location access denied or unavailable: " + err.message, "error");
            const statusText = document.getElementById('location-status-text');
            if (statusText) statusText.innerText = "Permission Denied / GPS Off";
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

function handleLocationSuccess(coords) {
    currentCoords = coords;
    const { latitude, longitude, accuracy } = coords;

    const statusText = document.getElementById('location-status-text');
    if (statusText) statusText.innerText = "GPS Live & Accurate";

    // Update coordinate fields
    const latEl = document.getElementById('coord-lat');
    const lngEl = document.getElementById('coord-lng');
    const accEl = document.getElementById('coord-accuracy');
    const timeEl = document.getElementById('coord-timestamp');

    if (latEl) latEl.innerText = latitude.toFixed(6);
    if (lngEl) lngEl.innerText = longitude.toFixed(6);
    if (accEl) accEl.innerText = `±${Math.round(accuracy)} meters`;
    if (timeEl) timeEl.innerText = new Date().toLocaleTimeString();

    // Generate Shareable Link
    const shareUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const linkInput = document.getElementById('shareable-map-link');
    if (linkInput) linkInput.value = shareUrl;

    // Pan map
    if (leafletMap) {
        leafletMap.setView([latitude, longitude], 16);

        // Remove old marker
        if (userMarker) leafletMap.removeLayer(userMarker);
        if (accuracyCircle) leafletMap.removeLayer(accuracyCircle);

        // Custom pulsing marker
        const pulseIcon = L.divIcon({
            className: 'custom-pulse-marker',
            html: `<div style="width: 24px; height: 24px; background: #EC4899; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 20px #EC4899;"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        userMarker = L.marker([latitude, longitude], { icon: pulseIcon }).addTo(leafletMap);
        userMarker.bindPopup(`<b>Your Live Location</b><br>Accurate to within ${Math.round(accuracy)}m`).openPopup();

        accuracyCircle = L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#8B5CF6',
            fillColor: '#8B5CF6',
            fillOpacity: 0.15,
            weight: 1
        }).addTo(leafletMap);
    }

    // Reverse geocode address
    reverseGeocode(latitude, longitude);
}

async function reverseGeocode(lat, lng) {
    const addressBox = document.getElementById('approx-address-box');
    if (!addressBox) return;

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
            addressBox.innerText = data.display_name;
        } else {
            addressBox.innerText = `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        }
    } catch (e) {
        addressBox.innerText = `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
}

function copyShareableLink() {
    const linkInput = document.getElementById('shareable-map-link');
    if (!linkInput || !linkInput.value) {
        showToast("Please acquire your location first.", "error");
        return;
    }
    navigator.clipboard.writeText(linkInput.value);
    showToast("📍 Map location link copied to clipboard!", "success");
}

function shareLocationWhatsApp() {
    if (!currentCoords) {
        showToast("Please acquire your location first.", "error");
        return;
    }
    const mapUrl = `https://www.google.com/maps?q=${currentCoords.latitude},${currentCoords.longitude}`;
    const msg = encodeURIComponent(`SHEGUARD Live Safety Update: Here is my current real-time GPS location: ${mapUrl}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
}

function shareLocationSms() {
    if (!currentCoords) {
        showToast("Please acquire your location first.", "error");
        return;
    }
    const mapUrl = `https://www.google.com/maps?q=${currentCoords.latitude},${currentCoords.longitude}`;
    const msg = encodeURIComponent(`SHEGUARD Live Location: ${mapUrl}`);
    window.location.href = `sms:?body=${msg}`;
}


// ===================================================================
// MODULE 3: SUSPICIOUS MESSAGE & SCAM DETECTOR
// ===================================================================
function initScamDetector() {
    const analyzeBtn = document.getElementById('btn-analyze-scam');
    const inputArea = document.getElementById('scam-message-input');
    const sampleChips = document.querySelectorAll('.sample-chip');

    if (!analyzeBtn || !inputArea) return;

    analyzeBtn.addEventListener('click', runScamAnalysis);

    sampleChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const sampleText = chip.getAttribute('data-text');
            if (sampleText) {
                inputArea.value = sampleText;
                runScamAnalysis();
            }
        });
    });

    console.log("🔍 Scam & Threat Detector module initialized.");
}

async function runScamAnalysis() {
    const inputArea = document.getElementById('scam-message-input');
    const analyzeBtn = document.getElementById('btn-analyze-scam');
    const resultsContainer = document.getElementById('scam-results-view');

    if (!inputArea) return;
    const msg = inputArea.value.trim();

    if (!msg) {
        showToast("Please enter or paste a message to analyze.", "error");
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Analyzing with AI...`;

    try {
        const res = await fetch('/api/analyze-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });

        const data = await res.json();
        if (data.analysis) {
            renderScamResults(data.analysis, data.ai_active);
            if (resultsContainer) resultsContainer.style.display = 'block';
            resultsContainer.scrollIntoView({ behavior: 'smooth' });
        } else {
            showToast("Analysis error: " + (data.error || "Unknown"), "error");
        }
    } catch (e) {
        showToast("Error analyzing message: " + e.message, "error");
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = `<i class="fas fa-shield-virus"></i> Run AI Security Scan`;
    }
}

function renderScamResults(analysis, aiActive) {
    // Risk Score
    const scoreEl = document.getElementById('result-risk-score');
    const badgeEl = document.getElementById('result-risk-badge');
    const summaryEl = document.getElementById('result-summary-text');
    const threatTypeEl = document.getElementById('result-threat-type');
    const redFlagsList = document.getElementById('result-red-flags-list');
    const actionsList = document.getElementById('result-actions-list');
    const aiBadge = document.getElementById('result-ai-engine-badge');

    if (scoreEl) scoreEl.innerText = `${analysis.risk_score}%`;
    if (badgeEl) {
        badgeEl.className = `risk-level-badge ${analysis.risk_level}`;
        badgeEl.innerText = analysis.risk_level;
    }

    if (summaryEl) summaryEl.innerText = analysis.summary || "Analysis complete.";
    if (threatTypeEl) threatTypeEl.innerText = analysis.threat_type || "General";

    if (aiBadge) {
        aiBadge.innerHTML = aiActive
            ? `<span style="color: var(--success-green);"><i class="fas fa-check-circle"></i> Live Gemini AI Analysis</span>`
            : `<span style="color: var(--warning-amber);"><i class="fas fa-info-circle"></i> Offline Safety Rules Engine</span>`;
    }

    if (redFlagsList) {
        redFlagsList.innerHTML = '';
        (analysis.red_flags || []).forEach(flag => {
            const li = document.createElement('li');
            li.className = 'red-flag-item';
            li.innerHTML = `<i class="fas fa-exclamation-circle" style="color: var(--sos-red); margin-top: 3px;"></i> <span>${escapeHtml(flag)}</span>`;
            redFlagsList.appendChild(li);
        });
    }

    if (actionsList) {
        actionsList.innerHTML = '';
        (analysis.recommendations || []).forEach(rec => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.alignItems = 'flex-start';
            li.style.gap = '8px';
            li.style.marginBottom = '8px';
            li.innerHTML = `<i class="fas fa-check" style="color: var(--success-green); margin-top: 4px;"></i> <span>${escapeHtml(rec)}</span>`;
            actionsList.appendChild(li);
        });
    }
}


// ===================================================================
// MODULE 4: TRUSTED CONTACTS MANAGER
// ===================================================================
function openAddContactModal() {
    const modal = document.getElementById('contact-form-modal');
    if (!modal) return;
    document.getElementById('contact-modal-title').innerText = "Add Trusted Contact";
    document.getElementById('contact-form-id').value = "";
    document.getElementById('contact-form-name').value = "";
    document.getElementById('contact-form-phone').value = "";
    document.getElementById('contact-form-relationship').value = "Mother";
    document.getElementById('contact-form-primary').checked = false;
    modal.classList.add('active');
}

function editContact(id, name, phone, rel, isPrimary) {
    const modal = document.getElementById('contact-form-modal');
    if (!modal) return;
    document.getElementById('contact-modal-title').innerText = "Edit Trusted Contact";
    document.getElementById('contact-form-id').value = id;
    document.getElementById('contact-form-name').value = name;
    document.getElementById('contact-form-phone').value = phone;
    document.getElementById('contact-form-relationship').value = rel;
    document.getElementById('contact-form-primary').checked = !!isPrimary;
    modal.classList.add('active');
}

function closeContactModal() {
    const modal = document.getElementById('contact-form-modal');
    if (modal) modal.classList.remove('active');
}

async function handleContactFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('contact-form-id').value;
    const name = document.getElementById('contact-form-name').value.trim();
    const phone = document.getElementById('contact-form-phone').value.trim();
    const relationship = document.getElementById('contact-form-relationship').value;
    const is_primary = document.getElementById('contact-form-primary').checked ? 1 : 0;

    if (!name || !phone) {
        showToast("Name and phone number are required.", "error");
        return;
    }

    const payload = { name, phone, relationship, is_primary };
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/contacts/${id}` : '/api/contacts';

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showToast(id ? "Contact updated!" : "Contact added successfully!", "success");
            closeContactModal();
            setTimeout(() => window.location.reload(), 800);
        } else {
            showToast(data.error || "Failed to save contact.", "error");
        }
    } catch (err) {
        showToast("Error saving contact: " + err.message, "error");
    }
}

async function deleteContact(id, name) {
    if (!confirm(`Are you sure you want to remove ${name} from your trusted emergency contacts?`)) {
        return;
    }

    try {
        const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast("Contact deleted.", "info");
            setTimeout(() => window.location.reload(), 700);
        } else {
            showToast(data.error || "Failed to delete contact.", "error");
        }
    } catch (e) {
        showToast("Error deleting: " + e.message, "error");
    }
}


// ===================================================================
// MODULE 5: FAKE CALL SIMULATOR (WEB AUDIO RINGTONE + SPEECH)
// ===================================================================
let ringAudioCtx = null;
let ringOsc1 = null;
let ringOsc2 = null;
let ringInterval = null;
let callDurationTimer = null;
let callSecondsElapsed = 0;
let callDelayTimeout = null;

function triggerFakeCall() {
    const callerNameInput = document.getElementById('fake-caller-name');
    const delaySelect = document.getElementById('fake-call-delay');

    const callerName = callerNameInput ? callerNameInput.value.trim() || 'Mom' : 'Mom';
    const delaySeconds = delaySelect ? parseInt(delaySelect.value, 10) || 0 : 0;

    if (delaySeconds > 0) {
        showToast(`📞 Fake Call scheduled in ${delaySeconds} seconds. Lock screen or keep app open.`, 'info', 4000);
        if (callDelayTimeout) clearTimeout(callDelayTimeout);
        callDelayTimeout = setTimeout(() => {
            startIncomingCallScreen(callerName);
        }, delaySeconds * 1000);
    } else {
        startIncomingCallScreen(callerName);
    }
}

function startIncomingCallScreen(callerName) {
    const overlay = document.getElementById('call-simulator-overlay');
    const callerNameEl = document.getElementById('call-overlay-caller-name');
    const incomingView = document.getElementById('incoming-call-view');
    const activeView = document.getElementById('active-call-view');

    if (!overlay) return;

    if (callerNameEl) callerNameEl.innerText = callerName;
    if (incomingView) incomingView.style.display = 'block';
    if (activeView) activeView.style.display = 'none';

    overlay.classList.add('active');

    // Start realistic ringtone sound
    startPhoneRingtone();

    // Vibrate device if supported
    if (navigator.vibrate) {
        navigator.vibrate([1000, 1000, 1000, 1000, 1000]);
    }
}

function startPhoneRingtone() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        ringAudioCtx = new AudioContext();

        // Realistic standard US/UK dial & ring cadence: 440Hz + 480Hz
        const playBeep = () => {
            if (!ringAudioCtx) return;
            const now = ringAudioCtx.currentTime;
            const osc1 = ringAudioCtx.createOscillator();
            const osc2 = ringAudioCtx.createOscillator();
            const gain = ringAudioCtx.createGain();

            osc1.type = 'sine';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(440, now);
            osc2.frequency.setValueAtTime(480, now);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.setValueAtTime(0.3, now + 1.8);
            gain.gain.linearRampToValueAtTime(0.0001, now + 2.0);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ringAudioCtx.destination);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 2.0);
            osc2.stop(now + 2.0);
        };

        playBeep();
        ringInterval = setInterval(playBeep, 4000);
    } catch (e) {
        console.warn("Could not play ringtone audio:", e);
    }
}

function stopPhoneRingtone() {
    if (ringInterval) clearInterval(ringInterval);
    if (ringAudioCtx) {
        try { ringAudioCtx.close(); } catch (e) {}
    }
    ringAudioCtx = null;
    if (navigator.vibrate) navigator.vibrate(0);
}

function acceptFakeCall() {
    stopPhoneRingtone();

    const incomingView = document.getElementById('incoming-call-view');
    const activeView = document.getElementById('active-call-view');

    if (incomingView) incomingView.style.display = 'none';
    if (activeView) activeView.style.display = 'flex';

    // Start call timer
    callSecondsElapsed = 0;
    const timerEl = document.getElementById('active-call-timer');
    if (callDurationTimer) clearInterval(callDurationTimer);

    callDurationTimer = setInterval(() => {
        callSecondsElapsed++;
        const mins = String(Math.floor(callSecondsElapsed / 60)).padStart(2, '0');
        const secs = String(callSecondsElapsed % 60).padStart(2, '0');
        if (timerEl) timerEl.innerText = `${mins}:${secs}`;
    }, 1000);

    // Simulated voice speaking
    if (speechSynth) {
        const text = "Hey! Where are you right now? I am waiting in the car right outside. Wrap it up and come out, let's head home together!";
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.0;
        utter.pitch = 1.1;
        speechSynth.speak(utter);
    }
}

function declineFakeCall() {
    stopPhoneRingtone();
    if (callDurationTimer) clearInterval(callDurationTimer);
    if (speechSynth && speechSynth.speaking) speechSynth.cancel();

    const overlay = document.getElementById('call-simulator-overlay');
    if (overlay) overlay.classList.remove('active');

    showToast("Call ended.", "info");
}


// Auto-initialize modules depending on current route
document.addEventListener('DOMContentLoaded', () => {
    initChatbot();
    initLocationModule();
    initScamDetector();
});
