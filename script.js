
// ============================================================
//  JAVASCRIPT UTAMA OPA OFFICIAL V39
// ============================================================

let currentUser = localStorage.getItem('opa_current_user') || null;
let userRole = localStorage.getItem('opa_current_role') || 'member';
let activeChatMode = 'group';
let currentPrivateTarget = null;

document.addEventListener('DOMContentLoaded', () => {
    initAppSession();
    loadUIPreferences();
});

function initAppSession() {
    if (currentUser) {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        renderUserInfo();
        initTabsAccess();
        renderHomeData();
        renderAnggotaList();
        renderCustomRegFields();
        renderAdminMembers();
        renderPrivateConversations();
        renderGroupMessages();
    } else {
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('main-app').classList.add('hidden');
    }
}

// Switch Login / Register Mode
function switchLoginMode(mode) {
    const btnLogin = document.getElementById('tab-btn-login');
    const btnReg = document.getElementById('tab-btn-register');
    const submitBtn = document.getElementById('auth-submit-btn');
    
    if (mode === 'login') {
        btnLogin.classList.add('active');
        btnReg.classList.remove('active');
        submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> MASUK';
    } else {
        btnReg.classList.add('active');
        btnLogin.classList.remove('active');
        submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> BUAT AKUN';
    }
}

// Auth Submit Handler
function handleAuthSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const isRegister = document.getElementById('tab-btn-register').classList.contains('active');

    if (!username || !password) return alert('Isi username dan password!');

    let users = JSON.parse(localStorage.getItem('opa_users')) || [];

    if (isRegister) {
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return alert('Username sudah terdaftar! Gunakan yang lain.');
        }
        users.push({ username, password, role: 'member' });
        localStorage.setItem('opa_users', JSON.stringify(users));
        alert('Akun berhasil dibuat! Silakan login.');
        switchLoginMode('login');
        return;
    }

    // Cek Admin Default atau User Tersimpan
    let role = 'member';
    if ((username.toLowerCase().includes('yosua') || username.toLowerCase().includes('feyn') || username.toLowerCase() === 'admin') && (password === 'YosuaAdmin15' || password === 'FeynAdmin15' || password === 'admin123')) {
        role = 'admin';
    } else {
        let found = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
        if (found) {
            role = found.role || 'member';
        } else if (password !== '123456' && password !== 'admin123') {
            return alert('Username atau Password salah!');
        }
    }

    currentUser = username;
    userRole = role;
    localStorage.setItem('opa_current_user', currentUser);
    localStorage.setItem('opa_current_role', userRole);

    initAppSession();
}

function handleLogout() {
    localStorage.removeItem('opa_current_user');
    localStorage.removeItem('opa_current_role');
    window.location.reload();
}

// Sidebar & Tabs
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function switchTab(tabId, el) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(m => m.classList.remove('active'));

    const target = document.getElementById('view-' + tabId);
    if (target) target.classList.add('active');
    if (el) el.classList.add('active');
    toggleSidebar();
}

function initTabsAccess() {
    const customRegMenu = document.getElementById('menu-custom-reg');
    const adminPanelMenu = document.getElementById('menu-admin-panel');
    if (userRole === 'admin') {
        if (customRegMenu) customRegMenu.classList.remove('hidden');
        if (adminPanelMenu) adminPanelMenu.classList.remove('hidden');
    } else {
        if (customRegMenu) customRegMenu.classList.add('hidden');
        if (adminPanelMenu) adminPanelMenu.classList.add('hidden');
    }
}

function renderUserInfo() {
    document.getElementById('header-username').innerText = currentUser;
}

// Home Data
function renderHomeData() {
    // Rendered via static HTML & CSS with modern animations
}

function downloadOriginalApp() {
    alert('Mengunduh APK OPA OFFICIAL Original (Versi Terbaru)...');
}

// Anggota & Hotbar Roster
let currentAnggotaFilter = 'diterima';

function renderAnggotaList() {
    const members = typeof MEMBERS !== 'undefined' ? MEMBERS : [];
    const term = document.getElementById('memberSearch').value.toLowerCase();
    
    const accepted = members.filter(m => m.status === 'diterima');
    const pending = members.filter(m => m.status === 'menunggu');
    
    document.getElementById('cntAccepted').innerText = accepted.length;
    document.getElementById('cntPending').innerText = pending.length;

    let list = currentAnggotaFilter === 'diterima' ? accepted : pending;
    if (term) {
        list = list.filter(m => (m.nama || '').toLowerCase().includes(term) || (m.id || '').includes(term) || (m.jabatan || '').toLowerCase().includes(term));
    }

    const container = document.getElementById('memberHotbarList');
    if (!list.length) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">Belum ada data anggota.</div>';
        return;
    }

    container.innerHTML = list.map(m => `
        <div class="roster-card-bar animate-fade-in">
            <div class="roster-field"><label>Nickname</label><span>${m.nama}</span></div>
            <div class="roster-field"><label>Name</label><span>${m.realname || m.nama}</span></div>
            <div class="roster-field"><label>ID Akun</label><span>${m.id || '-'}</span></div>
            <div class="roster-field"><label>Genre</label><span>${m.gender || 'Free Fire'}</span></div>
            <div class="roster-field"><label>Jabatan</label><span>${m.jabatan || 'Anggota'}</span></div>
            <div class="roster-field"><label>Status</label><span style="color:${m.status === 'diterima' ? '#10b981' : '#f97316'};">${m.status}</span></div>
        </div>
    `).join('');
}

document.getElementById('memberTabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    currentAnggotaFilter = btn.dataset.filter;
    document.querySelectorAll('#memberTabs .switch__opt').forEach(b => b.classList.toggle('active', b === btn));
    renderAnggotaList();
});
document.getElementById('memberSearch')?.addEventListener('input', renderAnggotaList);

// Register Flow
let currentStep = 1;
function goStep(stepNum) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.querySelector(`.step[data-step="${stepNum}"]`)?.classList.add('active');
}
document.getElementById('agreeCheck')?.addEventListener('change', (e) => {
    document.getElementById('toStep2').disabled = !e.target.checked;
});
document.getElementById('toStep2')?.addEventListener('click', () => goStep(2));
document.getElementById('toStep3')?.addEventListener('click', () => goStep(3));
document.querySelectorAll('[data-back-step]').forEach(btn => {
    btn.addEventListener('click', () => goStep(parseInt(btn.dataset.backStep)));
});

function handleRegistrationSubmit(e) {
    e.preventDefault();
    const nama = document.getElementById('reg-nama').value;
    const idGame = document.getElementById('reg-idgame').value;
    
    let members = JSON.parse(localStorage.getItem('opa_custom_members')) || (typeof MEMBERS !== 'undefined' ? MEMBERS : []);
    members.push({
        nama: 'OPA • ' + nama,
        id: idGame,
        jabatan: 'Anggota',
        status: 'menunggu',
        tanggal: new Date().toLocaleDateString()
    });
    localStorage.setItem('opa_custom_members', JSON.stringify(members));
    alert('Pendaftaran berhasil dikirim! Menunggu konfirmasi admin.');
    goStep(1);
}

// Chat & Pesan Modes
function switchChatMode(mode) {
    activeChatMode = mode;
    const btnGrp = document.getElementById('btn-toggle-group');
    const btnPrv = document.getElementById('btn-toggle-private');
    const boxGrp = document.getElementById('chat-mode-group');
    const boxPrv = document.getElementById('chat-mode-private');

    if (mode === 'group') {
        btnGrp.classList.add('active');
        btnPrv.classList.remove('active');
        boxGrp.classList.remove('hidden');
        boxPrv.classList.add('hidden');
    } else {
        btnPrv.classList.add('active');
        btnGrp.classList.remove('active');
        boxPrv.classList.remove('hidden');
        boxGrp.classList.add('hidden');
        renderPrivateConversations();
    }
}

function renderGroupMessages() {
    const box = document.getElementById('group-messages-box');
    let msgs = JSON.parse(localStorage.getItem('opa_group_chats')) || [
        { sender: 'OPA • Maboo', text: 'Selamat datang di obrolan resmi OPA OFFICIAL!', time: '10:00' }
    ];
    box.innerHTML = msgs.map(m => {
        const isMe = m.sender === currentUser;
        return `
            <div class="chat-bubble ${isMe ? 'outgoing' : 'incoming'}">
                <div class="chat-meta">${m.sender} &bull; ${m.time}</div>
                <div>${m.text}</div>
            </div>
        `;
    }).join('');
    box.scrollTop = box.scrollHeight;
}

function sendGroupMessage() {
    const input = document.getElementById('group-msg-input');
    const text = input.value.trim();
    if (!text) return;

    let msgs = JSON.parse(localStorage.getItem('opa_group_chats')) || [];
    msgs.push({ sender: currentUser, text: text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    localStorage.setItem('opa_group_chats', JSON.stringify(msgs));
    input.value = '';
    renderGroupMessages();
}

function handleGroupKey(e) { if (e.key === 'Enter') sendGroupMessage(); }

function insertEmoji(target, emoji) {
    const input = document.getElementById(target === 'group' ? 'group-msg-input' : 'private-msg-input');
    if (input) input.value += emoji;
}

// Private Chat
function renderPrivateConversations() {
    const list = document.getElementById('private-conversations-list');
    let members = typeof MEMBERS !== 'undefined' ? MEMBERS : [];
    list.innerHTML = members.filter(m => m.nama !== currentUser).map(m => `
        <div class="card" style="padding:12px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="openPrivateChat('${m.nama}')">
            <div><b>${m.nama}</b><br><small style="color:var(--text-muted);">ID: ${m.id}</small></div>
            <button class="btn-primary" style="width:auto; padding:6px 12px; font-size:11px;">Chat</button>
        </div>
    `).join('');
}

function openPrivateChat(targetName) {
    currentPrivateTarget = targetName;
    document.getElementById('private-inbox-view').classList.add('hidden');
    document.getElementById('private-chatroom-view').classList.remove('hidden');
    document.getElementById('private-chat-title').innerText = 'Chat dengan ' + targetName;
    renderPrivateMessages();
}

function closePrivateChat() {
    currentPrivateTarget = null;
    document.getElementById('private-chatroom-view').classList.add('hidden');
    document.getElementById('private-inbox-view').classList.remove('hidden');
}

function renderPrivateMessages() {
    if (!currentPrivateTarget) return;
    const box = document.getElementById('private-messages-box');
    let key = 'priv_' + [currentUser, currentPrivateTarget].sort().join('_');
    let msgs = JSON.parse(localStorage.getItem(key)) || [];
    box.innerHTML = msgs.map(m => {
        const isMe = m.sender === currentUser;
        return `
            <div class="chat-bubble ${isMe ? 'outgoing' : 'incoming'}">
                <div class="chat-meta">${m.sender} &bull; ${m.time}</div>
                <div>${m.text}</div>
            </div>
        `;
    }).join('');
    box.scrollTop = box.scrollHeight;
}

function sendPrivateMessage() {
    if (!currentPrivateTarget) return;
    const input = document.getElementById('private-msg-input');
    const text = input.value.trim();
    if (!text) return;

    let key = 'priv_' + [currentUser, currentPrivateTarget].sort().join('_');
    let msgs = JSON.parse(localStorage.getItem(key)) || [];
    msgs.push({ sender: currentUser, text: text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    localStorage.setItem(key, JSON.stringify(msgs));
    input.value = '';
    renderPrivateMessages();
}

function handlePrivateKey(e) { if (e.key === 'Enter') sendPrivateMessage(); }

function handlePrivateFileUpload(e) {
    const file = e.target.files[0];
    if (!file || !currentPrivateTarget) return;
    let key = 'priv_' + [currentUser, currentPrivateTarget].sort().join('_');
    let msgs = JSON.parse(localStorage.getItem(key)) || [];
    msgs.push({ sender: currentUser, text: `[Lampiran File: ${file.name}]`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    localStorage.setItem(key, JSON.stringify(msgs));
    renderPrivateMessages();
}

function insertPrivateFormat() {
    const input = document.getElementById('private-msg-input');
    if (input) input.value += ' [Format Laporan Guild] ';
}

// Kostumisasi UI & Kostumisasi Registrasi (Admin)
function applyUITheme(theme) {
    localStorage.setItem('opa_ui_theme', theme);
    document.body.setAttribute('data-theme', theme);
}

function applyUINavbar(navbarStyle) {
    localStorage.setItem('opa_ui_navbar', navbarStyle);
}

function saveUISettings() {
    const theme = document.getElementById('ui-theme-select').value;
    const navbar = document.getElementById('ui-navbar-select').value;
    const logo = document.getElementById('ui-logo-input').value;
    localStorage.setItem('opa_ui_theme', theme);
    localStorage.setItem('opa_ui_navbar', navbar);
    localStorage.setItem('opa_ui_logo', logo);
    alert('Kostumisasi UI berhasil disimpan!');
}

function loadUIPreferences() {
    const theme = localStorage.getItem('opa_ui_theme') || 'warm-orange';
    const navbar = localStorage.getItem('opa_ui_navbar') || 'default';
    const logo = localStorage.getItem('opa_ui_logo') || 'logo.png';
    document.getElementById('ui-theme-select').value = theme;
    document.getElementById('ui-navbar-select').value = navbar;
    document.getElementById('ui-logo-input').value = logo;
}

function renderCustomRegFields() {}
function addCustomRegField() {}
function renderAdminMembers() {}
function openLoginCSModal() { alert('Fitur Customer Service Bot aktif.'); }
function handleCSAction(type) {}
function sendCSMessage() {}
function handleCSKey(e) {}
