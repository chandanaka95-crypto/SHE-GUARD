/**
 * SHEGUARD – AI Women Safety Assistant
 * Core Script: Theme, Global SOS, Siren Audio Generator, Strobe, Toasts, Settings
 */

// ==========================================
// 1. THEME & APP INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    initHelplineQuickCheck();
});

function initTheme() {
    const savedTheme = localStorage.getItem('sheguard_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('sheguard_theme', next);
            updateThemeIcon(next);
            showToast(`Switched to ${next} mode`, 'info');
        });
    }
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle-btn i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function initSidebar() {
    const toggleBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 868 && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }
}

function initHelplineQuickCheck() {
    // Quick status log
    console.log("🛡️ SHEGUARD Safety Core Initialized. System armed & ready.");
}

// ==========================================
// 2. TOAST NOTIFICATIONS SYSTEM
// ==========================================
function showToast(message, type = 'info', duration = 3500) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconClass = 'fa-info-circle';
    if (type === 'success') iconClass = 'fa-check-circle';
    if (type === 'error') iconClass = 'fa-exclamation-triangle';

    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <div style="flex: 1;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ==========================================
// 3. EMERGENCY SIREN AUDIO OSCILLATOR & SCREEN STROBE
// ==========================================
let sirenAudioCtx = null;
let sirenOsc1 = null;
let sirenOsc2 = null;
let sirenGain = null;
let sirenInterval = null;
let isSirenActive = false;

function toggleEmergencySiren() {
    if (isSirenActive) {
        stopEmergencySiren();
    } else {
        startEmergencySiren();
    }
}

function startEmergencySiren() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        sirenAudioCtx = new AudioContext();

        sirenOsc1 = sirenAudioCtx.createOscillator();
        sirenOsc2 = sirenAudioCtx.createOscillator();
        sirenGain = sirenAudioCtx.createGain();

        sirenOsc1.type = 'sawtooth';
        sirenOsc2.type = 'sine';

        // Modulate between high and low frequencies (Police / Safety Siren)
        let toggle = false;
        sirenOsc1.frequency.setValueAtTime(650, sirenAudioCtx.currentTime);
        sirenOsc2.frequency.setValueAtTime(950, sirenAudioCtx.currentTime);

        sirenInterval = setInterval(() => {
            if (!sirenAudioCtx) return;
            const now = sirenAudioCtx.currentTime;
            if (toggle) {
                sirenOsc1.frequency.exponentialRampToValueAtTime(650, now + 0.3);
                sirenOsc2.frequency.exponentialRampToValueAtTime(950, now + 0.3);
            } else {
                sirenOsc1.frequency.exponentialRampToValueAtTime(950, now + 0.3);
                sirenOsc2.frequency.exponentialRampToValueAtTime(1300, now + 0.3);
            }
            toggle = !toggle;
        }, 350);

        sirenGain.gain.setValueAtTime(0.4, sirenAudioCtx.currentTime);

        sirenOsc1.connect(sirenGain);
        sirenOsc2.connect(sirenGain);
        sirenGain.connect(sirenAudioCtx.destination);

        sirenOsc1.start();
        sirenOsc2.start();

        isSirenActive = true;

        // Visual strobe effect
        let strobe = document.getElementById('siren-strobe');
        if (strobe) strobe.classList.add('active');

        // Update button visual
        const sirenBtn = document.getElementById('topbar-siren-btn');
        if (sirenBtn) {
            sirenBtn.style.background = '#EF4444';
            sirenBtn.style.color = '#FFFFFF';
        }

        showToast('⚠️ Emergency Siren & Strobe Activated! Tap again to turn off.', 'error', 4000);
    } catch (err) {
        console.error("Audio Context Error:", err);
        showToast('Could not initialize audio siren: ' + err.message, 'error');
    }
}

function stopEmergencySiren() {
    if (sirenInterval) clearInterval(sirenInterval);
    if (sirenOsc1) {
        try { sirenOsc1.stop(); sirenOsc1.disconnect(); } catch (e) {}
    }
    if (sirenOsc2) {
        try { sirenOsc2.stop(); sirenOsc2.disconnect(); } catch (e) {}
    }
    if (sirenAudioCtx) {
        try { sirenAudioCtx.close(); } catch (e) {}
    }
    sirenAudioCtx = null;
    isSirenActive = false;

    const strobe = document.getElementById('siren-strobe');
    if (strobe) strobe.classList.remove('active');

    const sirenBtn = document.getElementById('topbar-siren-btn');
    if (sirenBtn) {
        sirenBtn.style.background = '';
        sirenBtn.style.color = '';
    }

    showToast('Emergency Siren stopped.', 'info');
}

// ==========================================
// 4. GLOBAL EMERGENCY SOS CONTROLLER
// ==========================================
let sosCountdownTimer = null;
let sosRemainingSeconds = 5;

function triggerSosSequence() {
    const modal = document.getElementById('sos-countdown-modal');
    if (!modal) return;

    modal.classList.add('active');
    sosRemainingSeconds = 5;
    updateSosCountdownDisplay(sosRemainingSeconds);

    if (sosCountdownTimer) clearInterval(sosCountdownTimer);

    sosCountdownTimer = setInterval(() => {
        sosRemainingSeconds--;
        updateSosCountdownDisplay(sosRemainingSeconds);

        if (sosRemainingSeconds <= 0) {
            clearInterval(sosCountdownTimer);
            executeSosDispatch();
        }
    }, 1000);
}

function cancelSosSequence() {
    if (sosCountdownTimer) clearInterval(sosCountdownTimer);
    const modal = document.getElementById('sos-countdown-modal');
    if (modal) modal.classList.remove('active');
    showToast('Emergency SOS cancelled.', 'info');
}

function confirmSosImmediate() {
    if (sosCountdownTimer) clearInterval(sosCountdownTimer);
    executeSosDispatch();
}

function updateSosCountdownDisplay(sec) {
    const countEl = document.getElementById('sos-countdown-number');
    if (countEl) countEl.innerText = sec;
}

function executeSosDispatch() {
    const modal = document.getElementById('sos-countdown-modal');
    if (modal) modal.classList.remove('active');

    showToast('📡 Acquiring high-precision GPS coordinates...', 'info', 3000);

    // Retrieve Browser Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                dispatchSosToBackend(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
            },
            (err) => {
                console.warn("Geolocation warning:", err.message);
                showToast('Location permission not granted. Dispatching SOS with fallback.', 'error');
                dispatchSosToBackend(null, null, 0);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    } else {
        dispatchSosToBackend(null, null, 0);
    }
}

async function dispatchSosToBackend(lat, lng, accuracy) {
    try {
        const res = await fetch('/api/sos/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latitude: lat,
                longitude: lng,
                accuracy: accuracy,
                address: lat && lng ? `GPS Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Location Unavailable'
            })
        });

        const data = await res.json();
        if (data.success) {
            renderSosResultModal(data);
        } else {
            showToast('Failed to dispatch alert: ' + (data.error || 'Server error'), 'error');
        }
    } catch (err) {
        console.error("SOS Dispatch Error:", err);
        showToast('Error connecting to SOS server: ' + err.message, 'error');
    }
}

function renderSosResultModal(data) {
    const resultModal = document.getElementById('sos-result-modal');
    if (!resultModal) return;

    const msgBox = document.getElementById('sos-result-message');
    if (msgBox) msgBox.innerText = data.message_template;

    const contactsList = document.getElementById('sos-contacts-dispatch-list');
    if (contactsList) {
        contactsList.innerHTML = '';
        if (data.contacts && data.contacts.length > 0) {
            data.contacts.forEach(c => {
                const encodedMsg = encodeURIComponent(data.message_template);
                const cleanPhone = c.phone.replace(/[^0-9]/g, '');
                
                const item = document.createElement('div');
                item.className = 'glass-card';
                item.style.padding = '12px 16px';
                item.style.marginBottom = '10px';
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.justifyContent = 'space-between';

                item.innerHTML = `
                    <div>
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">
                            ${escapeHtml(c.name)} <span style="font-size: 0.75rem; color: var(--text-muted);">(${escapeHtml(c.relationship || 'Contact')})</span>
                        </div>
                        <div style="font-size: 0.82rem; color: var(--text-secondary);">${escapeHtml(c.phone)}</div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <a href="https://wa.me/${cleanPhone}?text=${encodedMsg}" target="_blank" class="btn btn-sm" style="background: #25D366; color: white;">
                            <i class="fab fa-whatsapp"></i> WhatsApp
                        </a>
                        <a href="sms:${cleanPhone}?body=${encodedMsg}" class="btn btn-sm btn-secondary">
                            <i class="fas fa-sms"></i> SMS
                        </a>
                        <a href="tel:${cleanPhone}" class="btn btn-sm btn-danger">
                            <i class="fas fa-phone"></i> Call
                        </a>
                    </div>
                `;
                contactsList.appendChild(item);
            });
        } else {
            contactsList.innerHTML = `<div style="color: var(--text-muted); font-size: 0.88rem; padding: 10px;">No trusted contacts added yet. <a href="/contacts" style="color: var(--primary-purple); text-decoration: underline;">Add trusted contacts here</a>.</div>`;
        }
    }

    resultModal.classList.add('active');
}

function closeSosResultModal() {
    const resultModal = document.getElementById('sos-result-modal');
    if (resultModal) resultModal.classList.remove('active');
}

// ==========================================
// 5. SETTINGS MODAL CONTROLLER
// ==========================================
async function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;

    try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        
        const keyInput = document.getElementById('settings-gemini-key');
        if (keyInput) {
            keyInput.placeholder = data.has_gemini_key ? `Current Key: ${data.masked_key}` : 'Paste your Gemini API key (AI Studio)...';
        }

        const templateInput = document.getElementById('settings-sos-template');
        if (templateInput && data.sos_template) {
            templateInput.value = data.sos_template;
        }

        modal.classList.add('active');
    } catch (e) {
        showToast('Error loading settings: ' + e.message, 'error');
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.remove('active');
}

async function saveSettingsForm(e) {
    if (e) e.preventDefault();
    const keyInput = document.getElementById('settings-gemini-key');
    const templateInput = document.getElementById('settings-sos-template');

    const payload = {};
    if (keyInput && keyInput.value.trim()) {
        payload.gemini_api_key = keyInput.value.trim();
    }
    if (templateInput) {
        payload.sos_template = templateInput.value.trim();
    }

    try {
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            showToast('Settings saved successfully!', 'success');
            closeSettingsModal();
            setTimeout(() => window.location.reload(), 1200);
        } else {
            showToast('Failed to save settings.', 'error');
        }
    } catch (err) {
        showToast('Error saving: ' + err.message, 'error');
    }
}

// Utility: Escape HTML for security
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
