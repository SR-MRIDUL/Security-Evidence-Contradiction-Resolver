// Global State Storage
let currentUser = null;
let evidenceList = [
    { id: 101, title: "Auth Log: Web Portal Login", type: "Auth", status: "Verified", time: "2026-11-07 14:28:10", detail: "Login success from IP 192.168.1.50 (Dhaka)" },
    { id: 102, title: "SSH Access: Remote Connection", type: "Network", status: "Contradiction", time: "2026-11-07 14:32:10", detail: "Remote session created from IP 45.12.89.2 (London) - Speed Conflict" },
    { id: 103, title: "System Event: Sudo Privilege Escalation", type: "System", status: "Verified", time: "2026-11-07 14:40:00", detail: "Sudo elevation granted for automated tasks" }
];

// Helper: SHA-256 Hashing Algorithm
async function computeSha256(str) {
    if (!str) return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// UI Event Listeners Init
document.addEventListener("DOMContentLoaded", () => {
    setupLandingPage();
    setupNavigation();
    setupAuthModal();
    setupForms();
    setupLogout();
    updateMetrics();
});

// Landing Page Flow Logic
function setupLandingPage() {
    const landingPage = document.getElementById('welcome-landing-page');
    const mainApp = document.getElementById('main-app-container');
    const goToLoginBtn = document.getElementById('go-to-login-btn');
    const goGuestBtn = document.getElementById('go-guest-btn');

    if(goToLoginBtn) {
        goToLoginBtn.addEventListener('click', () => {
            const authModal = document.getElementById('auth-modal');
            if(authModal) authModal.style.display = 'flex';
        });
    }

    if(goGuestBtn) {
        goGuestBtn.addEventListener('click', () => {
            handleSuccessfulLogin("Guest");
        });
    }
}

// Tab Navigation Logic
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

            const targetTab = document.getElementById(tabId);
            if(targetTab) targetTab.classList.add('active');
            button.classList.add('active');

            if (tabId === 'timeline') {
                renderTimeline();
            }
        });
    });
}

// Auth Modal Logic
function setupAuthModal() {
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const loginTab = document.getElementById('tab-login-btn');
    const regTab = document.getElementById('tab-reg-btn');
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');

    if(closeBtn) closeBtn.addEventListener('click', () => { if(modal) modal.style.display = 'none'; });

    if(loginTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            if(regTab) regTab.classList.remove('active');
            if(loginForm) loginForm.classList.add('active');
            if(regForm) regForm.classList.remove('active');
        });
    }

    if(regTab) {
        regTab.addEventListener('click', () => {
            regTab.classList.add('active');
            if(loginTab) loginTab.classList.remove('active');
            if(regForm) regForm.classList.add('active');
            if(loginForm) loginForm.classList.remove('active');
        });
    }

    const regPassInput = document.getElementById('reg-password');
    if(regPassInput) {
        regPassInput.addEventListener('input', async (e) => {
            const hash = await computeSha256(e.target.value);
            const hashOutput = document.getElementById('hash-output');
            if(hashOutput) hashOutput.innerText = hash;
        });
    }
}

// Helper: Handle UI Transition After Login or Guest Entry
function handleSuccessfulLogin(username) {
    currentUser = username;
    
    // Hide Landing Page & Auth Modal, Show Dashboard
    const landingPage = document.getElementById('welcome-landing-page');
    const mainApp = document.getElementById('main-app-container');
    const modal = document.getElementById('auth-modal');

    if(landingPage) landingPage.style.display = 'none';
    if(modal) modal.style.display = 'none';
    if(mainApp) mainApp.style.display = 'block';

    // Show Hello User Badge and Logout Button in Navbar
    const userBadge = document.getElementById('user-badge');
    const userDisplayName = document.getElementById('user-display-name');
    const logoutBtn = document.getElementById('logout-btn');

    if(userDisplayName) userDisplayName.innerText = `Hello, ${currentUser}`;
    if(userBadge) userBadge.style.display = 'flex';
    if(logoutBtn) logoutBtn.style.display = 'flex';
}

// Logout Functionality Handler
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');

    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            currentUser = null;
            alert("Logged out successfully.");
            location.reload(); // Re-initializes page back to Landing screen
        });
    }
}

// Form Handlers
function setupForms() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('login-username').value.trim();
            const pass = document.getElementById('login-password').value.trim();
            const err = document.getElementById('login-error');

            if (!user || !pass) {
                if(err) err.innerText = "Error: Username and Password required!";
                return;
            }

            if(err) err.innerText = "";
            handleSuccessfulLogin(user);
        });
    }

    const regForm = document.getElementById('register-form');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('reg-username').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const pass = document.getElementById('reg-password').value.trim();
            const err = document.getElementById('reg-error');

            if (!user || !email || !pass) {
                if(err) err.innerText = "Error: Input fields cannot be left empty.";
                return;
            }
            if (pass.length < 6) {
                if(err) err.innerText = "Error: Minimum password length is 6 characters.";
                return;
            }

            if(err) err.innerText = "";
            handleSuccessfulLogin(user);
        });
    }

    const uploadForm = document.getElementById('evidence-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('evidence-title').value.trim();
            const type = document.getElementById('evidence-type').value;
            const fileInput = document.getElementById('evidence-file');
            const textContent = document.getElementById('evidence-content').value.trim();

            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const reader = new FileReader();

                reader.onload = function(event) {
                    processAndSaveEvidence(titleInput || file.name, type, event.target.result);
                };
                reader.readAsText(file);
            } else {
                if (!textContent) {
                    alert("Please provide text payload or upload a file!");
                    return;
                }
                processAndSaveEvidence(titleInput || "Manual Log Entry", type, textContent);
            }
        });
    }
}

function processAndSaveEvidence(title, type, content) {
    const newId = 100 + evidenceList.length + 1;
    const isConflict = content.toLowerCase().includes("failed") || content.toLowerCase().includes("unauthorized") || content.toLowerCase().includes("error");
    const status = isConflict ? "Contradiction" : "Verified";
    
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    evidenceList.unshift({
        id: newId,
        title: title,
        type: type,
        status: status,
        time: timestamp,
        detail: content.length > 120 ? content.substring(0, 120) + "..." : content
    });

    updateMetrics();
    const form = document.getElementById('evidence-form');
    if(form) form.reset();
    alert("Evidence Log file processed & registered into system database successfully!");
}

function renderTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container) return;
    
    container.innerHTML = "";

    evidenceList.forEach(item => {
        const isConflict = item.status === "Contradiction";
        const cardHtml = `
            <div class="timeline-event ${isConflict ? 'conflict' : ''}">
                <div class="timeline-dot"></div>
                <div class="timeline-card">
                    <h4>
                        <span>${item.title}</span>
                        <span class="badge ${isConflict ? 'danger' : 'verified'}">${item.status}</span>
                    </h4>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.4rem;">
                        Timestamp: ${item.time} | Type: ${item.type}
                    </p>
                    <p style="font-size: 0.9rem; color: var(--text-primary); word-break: break-all;">${item.detail}</p>
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

function updateMetrics() {
    const totalElem = document.getElementById('total-logs-count');
    const contraElem = document.getElementById('contradiction-count');
    const verifiedElem = document.getElementById('verified-count');

    if(totalElem) totalElem.innerText = evidenceList.length;
    if(contraElem) contraElem.innerText = evidenceList.filter(x => x.status === "Contradiction").length;
    if(verifiedElem) verifiedElem.innerText = evidenceList.filter(x => x.status === "Verified").length;
}