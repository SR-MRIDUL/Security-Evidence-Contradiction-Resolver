// ============================================
// EVIDENCERESOLVER AI - JAVASCRIPT
// Frontend Demo Mode (Backend will be connected later)
// ============================================

let currentUser = null;

const STORAGE_KEYS = {
    evidence: 'evidenceResolverEvidence',
    users: 'evidenceResolverUsers',
    user: 'evidenceResolverCurrentUser'
};

// Default Evidence Data
const defaultEvidence = [
    {
        id: 101,
        title: 'Auth Log: Web Portal Login',
        type: 'Auth',
        status: 'Verified',
        time: '2026-11-07 14:28:10',
        detail: 'Login success from IP 192.168.1.50 (Dhaka)'
    },
    {
        id: 102,
        title: 'SSH Access: Remote Connection',
        type: 'Network',
        status: 'Contradiction',
        time: '2026-11-07 14:32:10',
        detail: 'Remote session created from IP 45.12.89.2 (London) - Speed Conflict'
    },
    {
        id: 103,
        title: 'System Event: Sudo Privilege Escalation',
        type: 'System',
        status: 'Verified',
        time: '2026-11-07 14:40:00',
        detail: 'Sudo elevation granted for automated tasks'
    }
];

let evidenceList = loadEvidence();


// ============================================
// LOCAL STORAGE FUNCTIONS
// ============================================

function loadEvidence() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.evidence));

        return Array.isArray(saved)
            ? saved
            : [...defaultEvidence];

    } catch (error) {
        console.error('Could not load saved evidence:', error);
        return [...defaultEvidence];
    }
}


function saveEvidence() {
    try {
        localStorage.setItem(
            STORAGE_KEYS.evidence,
            JSON.stringify(evidenceList)
        );

    } catch (error) {
        alert('Could not save evidence in this browser.');
        console.error(error);
    }
}


// ============================================
// SHA-256 PASSWORD HASH FUNCTION
// ============================================

async function computeSha256(value) {
    const text = new TextEncoder().encode(value || '');

    if (!window.crypto?.subtle) {
        return '';
    }

    const hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        text
    );

    return Array.from(
        new Uint8Array(hashBuffer),
        byte => byte.toString(16).padStart(2, '0')
    ).join('');
}


// ============================================
// PAGE INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    setupLandingPage();

    setupNavigation();

    setupAuthModal();

    setupForms();

    restoreSession();

    updateMetrics();

});


// ============================================
// LANDING PAGE
// ============================================

function showApplication() {

    const landing = document.getElementById(
        'welcome-landing-page'
    );

    const app = document.getElementById(
        'main-app-container'
    );

    if (landing) {
        landing.style.display = 'none';
    }

    if (app) {
        app.style.display = 'block';
    }
}


function setupLandingPage() {

    // Login / Register Button

    document.getElementById('go-to-login-btn')
        ?.addEventListener('click', () => {

            showApplication();

            openAuthModal('login');

        });


    // Continue as Guest Button

    document.getElementById('go-guest-btn')
        ?.addEventListener('click', () => {

            currentUser = null;

            localStorage.removeItem(
                STORAGE_KEYS.user
            );

            updateUserBadge();

            showApplication();

        });

}


// ============================================
// NAVIGATION SYSTEM
// ============================================

function setupNavigation() {

    document.querySelectorAll('.nav-btn').forEach(button => {

        button.addEventListener('click', () => {

            const tabId = button.dataset.tab;

            const target = document.getElementById(tabId);

            if (!target) return;


            // Hide all pages

            document.querySelectorAll('.tab-content')
                .forEach(tab => {

                    tab.classList.remove('active');

                });


            // Remove active navigation

            document.querySelectorAll('.nav-btn')
                .forEach(nav => {

                    nav.classList.remove('active');

                });


            // Show selected page

            target.classList.add('active');

            button.classList.add('active');


            // Timeline rendering

            if (tabId === 'timeline') {

                renderTimeline();

            }

        });

    });

}


// ============================================
// AUTHENTICATION MODAL
// ============================================

function openAuthModal(tab = 'login') {

    const modal = document.getElementById('auth-modal');

    if (modal) {

        modal.style.display = 'flex';

    }

    switchAuthTab(tab);

}


function closeAuthModal() {

    const modal = document.getElementById('auth-modal');

    if (modal) {

        modal.style.display = 'none';

    }

}


function switchAuthTab(tab) {

    const isLogin = tab === 'login';

    document.getElementById('tab-login-btn')
        ?.classList.toggle('active', isLogin);

    document.getElementById('tab-reg-btn')
        ?.classList.toggle('active', !isLogin);

    document.getElementById('login-form')
        ?.classList.toggle('active', isLogin);

    document.getElementById('register-form')
        ?.classList.toggle('active', !isLogin);

}


// ============================================
// AUTH MODAL EVENT LISTENERS
// ============================================

function setupAuthModal() {

    // Navbar Login Button

    document.getElementById('open-auth-btn')
        ?.addEventListener('click', () => {

            if (currentUser) {

                logoutUser();

            } else {

                openAuthModal('login');

            }

        });


    // User Badge

    document.getElementById('user-badge')
        ?.addEventListener('click', () => {

            if (!currentUser) {

                openAuthModal('login');

            }

        });


    // Close Modal

    document.getElementById('close-modal-btn')
        ?.addEventListener('click', closeAuthModal);


    // Login Tab

    document.getElementById('tab-login-btn')
        ?.addEventListener('click', () => {

            switchAuthTab('login');

        });


    // Register Tab

    document.getElementById('tab-reg-btn')
        ?.addEventListener('click', () => {

            switchAuthTab('register');

        });


    // Click Outside Modal

    document.getElementById('auth-modal')
        ?.addEventListener('click', event => {

            if (event.target.id === 'auth-modal') {

                closeAuthModal();

            }

        });


    // Password Hash Preview

    document.getElementById('reg-password')
        ?.addEventListener('input', async event => {

            const output = document.getElementById('hash-output');

            if (!output) return;

            output.textContent = event.target.value
                ? (
                    await computeSha256(event.target.value)
                    || 'Hash preview unavailable'
                )
                : 'Enter a password to preview its hash';

        });

}


// ============================================
// USER STORAGE
// ============================================

function getSavedUsers() {

    try {

        const users = JSON.parse(
            localStorage.getItem(STORAGE_KEYS.users)
        );

        return Array.isArray(users) ? users : [];

    } catch (error) {

        return [];

    }

}


// ============================================
// SET CURRENT USER
// ============================================

function setCurrentUser(username) {

    currentUser = username;

    localStorage.setItem(
        STORAGE_KEYS.user,
        username
    );

    updateUserBadge();

    showApplication();

    closeAuthModal();

}


// ============================================
// RESTORE LOGIN SESSION
// ============================================

function restoreSession() {

    const savedUser = localStorage.getItem(
        STORAGE_KEYS.user
    );

    if (savedUser) {

        currentUser = savedUser;

        showApplication();

    }

    updateUserBadge();

}


// ============================================
// UPDATE USER BADGE
// ============================================

function updateUserBadge() {

    const badge = document.getElementById('user-badge');

    const authButton = document.getElementById('open-auth-btn');

    if (!badge) return;


    if (currentUser) {

        badge.innerHTML =
            `<i class="fa-solid fa-user-check"></i> ${escapeHtml(currentUser)}`;

        badge.title = 'Logged in';

        if (authButton) {

            authButton.textContent = 'Logout';

        }

    } else {

        badge.innerHTML =
            '<i class="fa-solid fa-user-lock"></i> Guest Mode';

        badge.title = 'Click to Login';

        if (authButton) {

            authButton.textContent = 'Login / Register';

        }

    }

}


// ============================================
// LOGOUT FUNCTION
// ============================================

function logoutUser() {

    currentUser = null;

    localStorage.removeItem(
        STORAGE_KEYS.user
    );

    updateUserBadge();

    openAuthModal('login');

}


// ============================================
// LOGIN / REGISTER / EVIDENCE FORMS
// ============================================

function setupForms() {

    // LOGIN FORM

    document.getElementById('login-form')
        ?.addEventListener('submit', async event => {

            event.preventDefault();

            const username = document.getElementById(
                'login-username'
            ).value.trim();

            const password = document.getElementById(
                'login-password'
            ).value;

            const error = document.getElementById(
                'login-error'
            );

            const users = getSavedUsers();

            const user = users.find(item =>
                item.username.toLowerCase() === username.toLowerCase()
            );


            if (
                !user ||
                user.passwordHash !== await computeSha256(password)
            ) {

                if (error) {

                    error.textContent = 'Invalid username or password.';

                }

                return;

            }


            if (error) {

                error.textContent = '';

            }

            setCurrentUser(user.username);

            event.target.reset();

        });



    // REGISTER FORM

    document.getElementById('register-form')
        ?.addEventListener('submit', async event => {

            event.preventDefault();

            const username = document.getElementById(
                'reg-username'
            ).value.trim();

            const email = document.getElementById(
                'reg-email'
            ).value.trim().toLowerCase();

            const password = document.getElementById(
                'reg-password'
            ).value;

            const error = document.getElementById(
                'reg-error'
            );

            const users = getSavedUsers();


            // Username Validation

            if (username.length < 3) {

                if (error) {

                    error.textContent =
                        'Username must be at least 3 characters.';

                }

                return;

            }


            // Password Validation

            if (password.length < 6) {

                if (error) {

                    error.textContent =
                        'Password must be at least 6 characters.';

                }

                return;

            }


            // Duplicate Account Check

            if (
                users.some(item =>
                    item.username.toLowerCase() === username.toLowerCase()
                    || item.email === email
                )
            ) {

                if (error) {

                    error.textContent =
                        'Username or email is already registered in this browser.';

                }

                return;

            }


            // Password Hashing

            const passwordHash = await computeSha256(password);

            if (!passwordHash) {

                if (error) {

                    error.textContent =
                        'Password hashing is unavailable. Please use localhost or HTTPS.';

                }

                return;

            }


            // Save User

            users.push({

                username,

                email,

                passwordHash

            });

            localStorage.setItem(
                STORAGE_KEYS.users,
                JSON.stringify(users)
            );


            if (error) {

                error.textContent = '';

            }

            setCurrentUser(username);

            event.target.reset();


            const hashOutput = document.getElementById('hash-output');

            if (hashOutput) {

                hashOutput.textContent =
                    'Enter a password to preview its hash';

            }

            alert(
                'Demo account created in this browser. Backend authentication will be connected later.'
            );

        });



    // EVIDENCE UPLOAD FORM

    document.getElementById('evidence-form')
        ?.addEventListener('submit', event => {

            event.preventDefault();

            const titleInput = document.getElementById(
                'evidence-title'
            ).value.trim();

            const type = document.getElementById(
                'evidence-type'
            ).value;

            const fileInput = document.getElementById(
                'evidence-file'
            );

            const textContent = document.getElementById(
                'evidence-content'
            ).value.trim();


            // File Upload

            if (fileInput.files.length) {

                const file = fileInput.files[0];

                const reader = new FileReader();

                reader.onload = () => {

                    processAndSaveEvidence(
                        titleInput || file.name,
                        type,
                        String(reader.result || '')
                    );

                };

                reader.onerror = () => {

                    alert(
                        'Could not read the selected file. Please try again.'
                    );

                };

                reader.readAsText(file);

            }

            // Text Upload

            else if (textContent) {

                processAndSaveEvidence(
                    titleInput || 'Manual Log Entry',
                    type,
                    textContent
                );

            }

            else {

                alert(
                    'Please paste log content or select a log file.'
                );

            }

        });

}


// ============================================
// PROCESS AND SAVE EVIDENCE
// ============================================

function processAndSaveEvidence(title, type, content) {

    if (!content.trim()) {

        alert('The selected file is empty.');

        return;

    }


    const lowerContent = content.toLowerCase();

    const isConflict = [
        'failed',
        'unauthorized',
        'error'
    ].some(keyword => lowerContent.includes(keyword));


    const now = new Date();


    const newEvidence = {

        id: Date.now(),

        title: title,

        type: type,

        status: isConflict
            ? 'Contradiction'
            : 'Verified',

        time: now.toLocaleString(),

        detail: content.length > 120
            ? `${content.slice(0, 120)}...`
            : content

    };


    evidenceList.unshift(newEvidence);

    saveEvidence();

    updateMetrics();


    document.getElementById('evidence-form')?.reset();


    if (
        document.getElementById('timeline')
            ?.classList.contains('active')
    ) {

        renderTimeline();

    }


    alert(
        'Evidence processed and saved in this browser.'
    );

}


// ============================================
// HTML SECURITY FUNCTION
// ============================================

function escapeHtml(value) {

    return String(value).replace(/[&<>"']/g, char => ({

        '&': '&amp;',

        '<': '&lt;',

        '>': '&gt;',

        '"': '&quot;',

        "'": '&#39;'

    })[char]);

}


// ============================================
// RENDER TIMELINE
// ============================================

function renderTimeline() {

    const container = document.getElementById(
        'timeline-container'
    );

    if (!container) return;

    container.replaceChildren();


    // Empty Timeline

    if (!evidenceList.length) {

        const empty = document.createElement('p');

        empty.textContent =
            'No evidence has been uploaded yet.';

        container.appendChild(empty);

        return;

    }


    // Timeline Items

    evidenceList.forEach(item => {

        const conflict = item.status === 'Contradiction';


        const event = document.createElement('div');

        event.className =
            `timeline-event ${conflict ? 'conflict' : ''}`;


        const dot = document.createElement('div');

        dot.className = 'timeline-dot';


        const card = document.createElement('div');

        card.className = 'timeline-card';


        const heading = document.createElement('h4');


        const title = document.createElement('span');

        title.textContent = item.title;


        const badge = document.createElement('span');

        badge.className =
            `badge ${conflict ? 'danger' : 'verified'}`;

        badge.textContent = item.status;


        heading.append(title, badge);


        const meta = document.createElement('p');

        meta.style.cssText =
            'font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.4rem;';

        meta.textContent =
            `Timestamp: ${item.time} | Type: ${item.type}`;


        const detail = document.createElement('p');

        detail.style.cssText =
            'font-size:0.9rem;color:var(--text-primary);word-break:break-all;';

        detail.textContent = item.detail;


        card.append(heading, meta, detail);

        event.append(dot, card);

        container.appendChild(event);

    });

}


// ============================================
// UPDATE DASHBOARD METRICS
// ============================================

function updateMetrics() {

    const total = document.getElementById(
        'total-logs-count'
    );

    const contradictions = document.getElementById(
        'contradiction-count'
    );

    const verified = document.getElementById(
        'verified-count'
    );


    if (total) {

        total.textContent = evidenceList.length;

    }


    if (contradictions) {

        contradictions.textContent =
            evidenceList.filter(item =>
                item.status === 'Contradiction'
            ).length;

    }


    if (verified) {

        verified.textContent =
            evidenceList.filter(item =>
                item.status === 'Verified'
            ).length;

    }

}