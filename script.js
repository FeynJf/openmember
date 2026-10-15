// ============================================================
//  OPA OFFICIAL V40 — SCRIPT UTAMA & LOGIC LENGKAP
// ============================================================

let _rawUser = localStorage.getItem('opa_current_user');
let currentUser = (_rawUser && _rawUser !== 'null' && _rawUser !== 'undefined') ? _rawUser : null;
let userRole = localStorage.getItem('opa_current_role') || 'member';
let activeChatMode = 'group';
let currentPrivateTarget = null;

document.addEventListener('DOMContentLoaded', () => {
    runSplashThenInit();
    loadUIPreferences();
    initRegistrationLogic();
});

function runSplashThenInit() {
    const splash = document.getElementById('splash-screen');
    const loginPage = document.getElementById('login-page');
    const loginCard = document.getElementById('login-card');

    if (currentUser) {
        // Sudah login → skip splash, langsung app
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => { if (splash) splash.style.display = 'none'; }, 500);
        }
        initAppSession();
        return;
    }

    // Belum login: splash 1.8s → login muncul dengan animasi
    setTimeout(() => {
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => {
                if (splash) splash.style.display = 'none';
                if (loginPage) loginPage.classList.remove('hidden');
                if (loginCard) loginCard.classList.add('login-enter');
                initAppSession();
            }, 500);
        } else {
            if (loginPage) loginPage.classList.remove('hidden');
            initAppSession();
        }
    }, 1800);
}

function initAppSession() {
    if (currentUser) {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        const splash = document.getElementById('splash-screen');
        if (splash) { splash.classList.add('fade-out'); splash.style.display = 'none'; }
        renderUserInfo();
        initTabsAccess();
        document.querySelectorAll('.content-section').forEach(s => {
            s.classList.remove('active');
            s.classList.add('hidden');
        });
        const home = document.getElementById('view-home');
        if (home) {
            home.classList.remove('hidden');
            home.classList.add('active');
        }
        document.querySelectorAll('.sidebar-menu .menu-item').forEach(m => m.classList.remove('active'));
        const homeMenu = document.querySelector('.sidebar-menu .menu-item');
        if (homeMenu) homeMenu.classList.add('active');

        renderAnggotaList();
        renderCustomRegFieldsTable();
        renderAdminMembersTable();
        renderPrivateConversations();
        renderGroupMessages();
        renderCSMessages();
    } else {
        // Jangan force show login di sini — splash yang mengatur
        document.getElementById('main-app').classList.add('hidden');
    }
}

// ========== AUTH ==========
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

function handleAuthSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const isRegister = document.getElementById('tab-btn-register').classList.contains('active');

    if (!username || !password) return alert('Isi username dan password!');

    let users = JSON.parse(localStorage.getItem('opa_users')) || [];

    if (isRegister) {
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            return alert('Username sudah terdaftar!');
        }
        users.push({ username, password, role: 'member' });
        localStorage.setItem('opa_users', JSON.stringify(users));
        alert('Akun berhasil dibuat! Silakan login.');
        switchLoginMode('login');
        return;
    }

    let role = 'member';
    if ((username.toLowerCase().includes('yosua') || username.toLowerCase().includes('feyn') || username.toLowerCase() === 'admin') && 
        (password === 'YosuaAdmin15' || password === 'FeynAdmin15' || password === 'admin123')) {
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
    currentUser = null;
    userRole = 'member';
    window.location.reload();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
}

function switchTab(tabId, el) {
    // Sembunyikan semua section, tampilkan yang dipilih
    document.querySelectorAll('.content-section').forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(m => m.classList.remove('active'));

    const target = document.getElementById('view-' + tabId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
    if (el) el.classList.add('active');
    
    // Render ulang data saat pindah tab
    if (tabId === 'anggota') renderAnggotaList();
    if (tabId === 'chat') {
        if (activeChatMode === 'group') renderGroupMessages();
        else renderPrivateConversations();
    }
    if (tabId === 'admin') renderAdminMembersTable();
    if (tabId === 'customreg') renderCustomRegFieldsTable();
    if (tabId === 'csbot') renderCSMessages();
    
    // Close sidebar on mobile
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
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
    const el = document.getElementById('header-username');
    if (el) el.innerText = (currentUser && currentUser !== 'null') ? currentUser : 'Tamu';
}

// ========== PROFILE MODAL ==========
function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    document.getElementById('profile-username-display').innerText = currentUser || '-';
    document.getElementById('profile-role-display').innerText = userRole === 'admin' ? 'Admin / Guild Master' : 'Member Guild';
    modal.classList.remove('hidden');
}
function closeProfileModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.closest('.modal-close-btn')) return;
    const modal = document.getElementById('profile-modal');
    if (modal) modal.classList.add('hidden');
}

// ========== ANGGOTA ==========
let currentAnggotaFilter = 'diterima';

function renderAnggotaList() {
    const members = typeof MEMBERS !== 'undefined' ? MEMBERS : [];
    const customMembers = JSON.parse(localStorage.getItem('opa_custom_members')) || [];
    const allMembers = [...members, ...customMembers];
    const searchEl = document.getElementById('memberSearch');
    const term = searchEl ? searchEl.value.toLowerCase() : '';
    
    const accepted = allMembers.filter(m => m.status === 'diterima');
    const pending = allMembers.filter(m => m.status === 'menunggu');
    
    const cntA = document.getElementById('cntAccepted');
    const cntP = document.getElementById('cntPending');
    if (cntA) cntA.innerText = accepted.length;
    if (cntP) cntP.innerText = pending.length;

    let list = currentAnggotaFilter === 'diterima' ? accepted : pending;
    if (term) {
        list = list.filter(m => 
            (m.nama || '').toLowerCase().includes(term) || 
            (m.id || '').includes(term) || 
            (m.jabatan || '').toLowerCase().includes(term)
        );
    }

    const container = document.getElementById('memberHotbarList');
    if (!container) return;
    
    if (!list.length) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-muted);">Belum ada data anggota.</div>';
        return;
    }

    // Deteksi online: user yang sedang login = online
    const onlineUser = currentUser ? currentUser.toLowerCase() : '';

    container.innerHTML = list.map(m => {
        const isOnline = onlineUser && (
            (m.nama || '').toLowerCase() === onlineUser ||
            (m.realname || '').toLowerCase() === onlineUser
        );
        const onlineLabel = isOnline ? 'Online' : (m.online === 'online' ? 'Online' : 'Offline');
        const onlineColor = (isOnline || m.online === 'online') ? 'var(--success)' : '#94a3b8';
        const statusAnggota = m.status === 'diterima' ? 'Diterima' : 'Menunggu';
        const statusColor = m.status === 'diterima' ? 'var(--success)' : '#f97316';
        return `
        <div class="roster-card-bar animate-fade-in">
            <div class="roster-field"><label>Nickname</label><span>${escapeHtml(m.nama || '-')}</span></div>
            <div class="roster-field"><label>Name</label><span>${escapeHtml(m.realname || m.nama || '-')}</span></div>
            <div class="roster-field"><label>ID Akun</label><span>${escapeHtml(m.id || '-')}</span></div>
            <div class="roster-field"><label>Genre</label><span>${escapeHtml(m.gender || '-')}</span></div>
            <div class="roster-field"><label>Jabatan</label><span>${escapeHtml(m.jabatan || 'Anggota')}</span></div>
            <div class="roster-field"><label>Status</label><span style="color:${onlineColor};">${onlineLabel}</span></div>
            <div class="roster-field"><label>Status Anggota</label><span style="color:${statusColor};">${statusAnggota}</span></div>
        </div>`;
    }).join('');
}

document.getElementById('memberTabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    currentAnggotaFilter = btn.dataset.filter;
    document.querySelectorAll('#memberTabs .switch__opt').forEach(b => b.classList.toggle('active', b === btn));
    renderAnggotaList();
});
document.getElementById('memberSearch')?.addEventListener('input', renderAnggotaList);

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
}

// ========== REGISTER ==========
function initRegistrationLogic() {
    const agreeCheck = document.getElementById('agreeCheck');
    const toStep2 = document.getElementById('toStep2');
    if (agreeCheck && toStep2) {
        agreeCheck.addEventListener('change', (e) => {
            toStep2.disabled = !e.target.checked;
        });
    }
}

function goStep(stepNum) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.querySelector(`.step[data-step="${stepNum}"]`)?.classList.add('active');
    document.querySelectorAll('.track__pt').forEach((pt, idx) => {
        pt.classList.toggle('active', idx + 1 === stepNum);
    });
}

document.getElementById('toStep2')?.addEventListener('click', () => goStep(2));
document.getElementById('toStep3')?.addEventListener('click', () => goStep(3));
document.querySelectorAll('[data-back-step]').forEach(btn => {
    btn.addEventListener('click', () => goStep(parseInt(btn.dataset.backStep)));
});

function handleRegistrationSubmit(e) {
    e.preventDefault();
    const nama = document.getElementById('reg-nama')?.value || '';
    const idGame = document.getElementById('reg-idgame')?.value || '';
    const namaLengkap = document.getElementById('reg-namalengkap')?.value || nama;
    const level = document.getElementById('reg-level')?.value || '';
    const hp = document.getElementById('reg-hp')?.value || '';
    const gender = document.getElementById('reg-gender')?.value || 'Laki-laki';

    if (!nama || !idGame) {
        alert('Isi data wajib!');
        return;
    }

    let customMembers = JSON.parse(localStorage.getItem('opa_custom_members')) || [];
    customMembers.push({
        nama: 'OPA • ' + nama,
        realname: namaLengkap,
        id: idGame,
        jabatan: 'Anggota',
        status: 'menunggu',
        gender: gender,
        online: 'offline',
        level: level,
        hp: hp,
        tanggal: new Date().toLocaleDateString('id-ID')
    });
    localStorage.setItem('opa_custom_members', JSON.stringify(customMembers));
    alert('Pendaftaran berhasil dikirim! Menunggu konfirmasi admin.');
    goStep(1);
    document.getElementById('regForm')?.reset();
    const agree = document.getElementById('agreeCheck');
    if (agree) agree.checked = false;
    const toStep2 = document.getElementById('toStep2');
    if (toStep2) toStep2.disabled = true;
    renderAnggotaList();
    renderAdminMembersTable();
}

// ========== CHAT ==========
function switchChatMode(mode) {
    activeChatMode = mode;
    const btnGrp = document.getElementById('btn-toggle-group');
    const btnPrv = document.getElementById('btn-toggle-private');
    const boxGrp = document.getElementById('chat-mode-group');
    const boxPrv = document.getElementById('chat-mode-private');

    if (mode === 'group') {
        btnGrp?.classList.add('active');
        btnPrv?.classList.remove('active');
        boxGrp?.classList.remove('hidden');
        boxPrv?.classList.add('hidden');
    } else {
        btnPrv?.classList.add('active');
        btnGrp?.classList.remove('active');
        boxPrv?.classList.remove('hidden');
        boxGrp?.classList.add('hidden');
        renderPrivateConversations();
        // Show floating + only on inbox view
        const floating = document.getElementById('floatingPlusBtn');
        if (floating) floating.style.display = 'flex';
    }
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.replace(/OPA\s*[•・]\s*/i, '').trim().split(/\s+/);
    return (parts[0] || '?').charAt(0).toUpperCase();
}

function buildChatHTML(m, isMe) {
    const statusIcon = isMe
        ? `<div class="chat-status delivered"><i class="fa-solid fa-check-double"></i> Terkirim</div>`
        : '';
    return `
        <div class="chat-msg-row ${isMe ? 'outgoing' : 'incoming'}">
            <div class="chat-avatar">${getInitials(m.sender)}</div>
            <div class="chat-bubble">
                <div class="chat-meta">
                    <span class="chat-nick">${escapeHtml(m.sender)}</span>
                    <span class="chat-time">${m.time}</span>
                </div>
                <div>${escapeHtml(m.text)}</div>
                ${statusIcon}
            </div>
        </div>
    `;
}

function renderGroupMessages() {
    const box = document.getElementById('group-messages-box');
    if (!box) return;
    let msgs = JSON.parse(localStorage.getItem('opa_group_chats')) || [
        { sender: 'OPA • Maboo', text: 'Selamat datang di obrolan resmi OPA OFFICIAL!', time: '10:00' }
    ];
    box.innerHTML = msgs.map(m => buildChatHTML(m, m.sender === currentUser)).join('');
    box.scrollTop = box.scrollHeight;
}

function showTypingIndicator(boxId, who) {
    const box = document.getElementById(boxId);
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'chat-msg-row incoming';
    el.id = 'typing-temp';
    el.innerHTML = `
        <div class="chat-avatar">${getInitials(who)}</div>
        <div class="chat-bubble" style="padding:10px 16px;">
            <div class="chat-meta"><span class="chat-nick">${escapeHtml(who)}</span></div>
            <span class="typing-dots"><span></span><span></span><span></span></span>
        </div>
    `;
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
}

function sendGroupMessage() {
    const input = document.getElementById('group-msg-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    // Animasi "sedang mengetik" singkat sebelum pesan muncul
    const typingEl = document.getElementById('group-typing');
    if (typingEl) {
        typingEl.innerHTML = 'Mengetik<span class="typing-dots"><span></span><span></span><span></span></span>';
    }

    input.value = '';
    setTimeout(() => {
        let msgs = JSON.parse(localStorage.getItem('opa_group_chats')) || [];
        msgs.push({
            sender: currentUser,
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        localStorage.setItem('opa_group_chats', JSON.stringify(msgs));
        if (typingEl) typingEl.innerHTML = 'Online';
        renderGroupMessages();
    }, 450);
}

function handleGroupKey(e) { if (e.key === 'Enter') sendGroupMessage(); }

let emojiTarget = 'group';
function insertEmoji(target, emoji) {
    // Jika dipanggil dari tombol emoji di UI (tanpa emoji spesifik), buka picker
    if (!emoji || emoji === '😁') {
        emojiTarget = target;
        openEmojiModal();
        return;
    }
    const input = document.getElementById(target === 'group' ? 'group-msg-input' : 'private-msg-input');
    if (input) {
        input.value += emoji;
        input.focus();
    }
}

function openEmojiModal() {
    const modal = document.getElementById('emoji-modal');
    const grid = document.getElementById('emoji-grid');
    if (!modal || !grid) return;
    const emojis = ['😀','😁','😂','🤣','😊','😍','🥰','😘','😜','😎','🤩','😇','🤗','🤔','😅','😭','😡','👍','👎','👏','🙏','🔥','⭐','💯','❤️','💔','🎮','🏆','⚔️','🛡️','👑','💎','🚀','⚡','🎉','💪','🤝','👋','✅','❌','📌','💬','📢','🕐'];
    grid.innerHTML = emojis.map(em => `<button type="button" style="font-size:22px;background:transparent;border:none;cursor:pointer;padding:6px;border-radius:8px;" onclick="pickEmoji('${em}')">${em}</button>`).join('');
    modal.classList.remove('hidden');
}
function closeEmojiModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.closest('.modal-close-btn')) return;
    document.getElementById('emoji-modal')?.classList.add('hidden');
}
function pickEmoji(em) {
    const input = document.getElementById(emojiTarget === 'group' ? 'group-msg-input' : 'private-msg-input');
    if (input) { input.value += em; input.focus(); }
    closeEmojiModal();
}

function insertPrivateFormat() {
    const input = document.getElementById('private-msg-input');
    if (input) {
        input.value = 'Terimakasih Sudah Mau Bergabung Sama Kami Silahkan Menunggu 1x24jam Buat menunggu Kalau sudah Di Terima/Approve Kamu check aja di bagian anggota melihat bagian Status Anggota nya.';
        input.focus();
    }
}

// Private Chat
function renderPrivateConversations() {
    const list = document.getElementById('private-conversations-list');
    if (!list) return;
    let members = typeof MEMBERS !== 'undefined' ? MEMBERS : [];
    let customMembers = JSON.parse(localStorage.getItem('opa_custom_members')) || [];
    let all = [...members, ...customMembers];

    const filtered = all.filter(m => m.nama !== currentUser);
    if (!filtered.length) {
        list.innerHTML = '<div style="text-align:center; padding:30px; color:var(--text-muted);">Belum ada anggota untuk di-chat.</div>';
        return;
    }

    list.innerHTML = filtered.map(m => `
        <div class="card" style="padding:14px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="openPrivateChat('${escapeHtml(m.nama)}')">
            <div>
                <b style="font-size:13px;">${escapeHtml(m.nama)}</b><br>
                <small style="color:var(--text-muted); font-size:11px;">ID: ${escapeHtml(m.id || '-')}</small>
            </div>
            <button class="btn-primary btn-sm" style="pointer-events:none;">Chat</button>
        </div>
    `).join('');
}

function openNewChatModal() {
    const modal = document.getElementById('new-chat-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    const list = document.getElementById('new-chat-members-list');
    let members = typeof MEMBERS !== 'undefined' ? MEMBERS : [];
    let customMembers = JSON.parse(localStorage.getItem('opa_custom_members')) || [];
    let all = [...members, ...customMembers];
    
    list.innerHTML = all.filter(m => m.nama !== currentUser).map(m => `
        <div style="padding:12px; background:#f8fafc; border-radius:10px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; border:1px solid var(--border);" onclick="openPrivateChat('${escapeHtml(m.nama)}'); closeNewChatModal();">
            <span style="font-weight:600; font-size:13px;">${escapeHtml(m.nama)}</span>
            <i class="fa-solid fa-chevron-right" style="color:var(--text-muted); font-size:12px;"></i>
        </div>
    `).join('');
}

function closeNewChatModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.closest('.modal-close-btn')) return;
    const modal = document.getElementById('new-chat-modal');
    if (modal) modal.classList.add('hidden');
}

function openPrivateChat(targetName) {
    currentPrivateTarget = targetName;
    document.getElementById('private-inbox-view')?.classList.add('hidden');
    const room = document.getElementById('private-chatroom-view');
    if (room) {
        room.classList.remove('hidden');
        room.style.display = 'flex';
    }
    const title = document.getElementById('private-chat-title');
    if (title) title.innerText = 'Chat dengan ' + targetName;
    
    const floating = document.getElementById('floatingPlusBtn');
    if (floating) floating.style.display = 'none';
    
    renderPrivateMessages();
}

function closePrivateChat() {
    currentPrivateTarget = null;
    document.getElementById('private-chatroom-view')?.classList.add('hidden');
    const room = document.getElementById('private-chatroom-view');
    if (room) room.style.display = 'none';
    document.getElementById('private-inbox-view')?.classList.remove('hidden');
    
    const floating = document.getElementById('floatingPlusBtn');
    if (floating) floating.style.display = 'flex';
}

function renderPrivateMessages() {
    if (!currentPrivateTarget) return;
    const box = document.getElementById('private-messages-box');
    if (!box) return;
    let key = 'priv_' + [currentUser, currentPrivateTarget].sort().join('_');
    let msgs = JSON.parse(localStorage.getItem(key)) || [];
    box.innerHTML = msgs.map(m => buildChatHTML(m, m.sender === currentUser)).join('');
    box.scrollTop = box.scrollHeight;
}

function sendPrivateMessage() {
    if (!currentPrivateTarget) return;
    const input = document.getElementById('private-msg-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    // Animasi mengetik singkat
    showTypingIndicator('private-messages-box', currentUser);
    setTimeout(() => {
        const temp = document.getElementById('typing-temp');
        if (temp) temp.remove();
        let key = 'priv_' + [currentUser, currentPrivateTarget].sort().join('_');
        let msgs = JSON.parse(localStorage.getItem(key)) || [];
        msgs.push({
            sender: currentUser,
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        localStorage.setItem(key, JSON.stringify(msgs));
        renderPrivateMessages();
    }, 450);
}

function handlePrivateKey(e) { if (e.key === 'Enter') sendPrivateMessage(); }

function handlePrivateFileUpload(e) {
    const file = e.target.files[0];
    if (!file || !currentPrivateTarget) return;
    let key = 'priv_' + [currentUser, currentPrivateTarget].sort().join('_');
    let msgs = JSON.parse(localStorage.getItem(key)) || [];
    msgs.push({
        sender: currentUser,
        text: `[Lampiran File: ${file.name}]`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem(key, JSON.stringify(msgs));
    renderPrivateMessages();
    e.target.value = '';
}

// ========== CUSTOM REG & ADMIN ==========
function renderCustomRegFieldsTable() {
    const tbody = document.getElementById('custom-reg-tbody');
    if (!tbody) return;
    let fields = JSON.parse(localStorage.getItem('opa_custom_reg_fields')) || [
        { label: 'Divisi Game (ML/FF)', type: 'text' }
    ];
    tbody.innerHTML = fields.map((f, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(f.label)}</td>
            <td>${escapeHtml(f.type)}</td>
            <td><button class="btn-outline btn-sm" onclick="deleteCustomRegField(${idx})">Hapus</button></td>
        </tr>
    `).join('');
}

function addCustomRegField() {
    const label = document.getElementById('custom-reg-label')?.value.trim();
    const type = document.getElementById('custom-reg-type')?.value || 'text';
    if (!label) return alert('Label field wajib diisi!');
    let fields = JSON.parse(localStorage.getItem('opa_custom_reg_fields')) || [];
    fields.push({ label, type });
    localStorage.setItem('opa_custom_reg_fields', JSON.stringify(fields));
    document.getElementById('custom-reg-label').value = '';
    renderCustomRegFieldsTable();
    alert('Field baru berhasil ditambahkan!');
}

function deleteCustomRegField(idx) {
    let fields = JSON.parse(localStorage.getItem('opa_custom_reg_fields')) || [];
    fields.splice(idx, 1);
    localStorage.setItem('opa_custom_reg_fields', JSON.stringify(fields));
    renderCustomRegFieldsTable();
}

function getAllMembersList() {
    let members = typeof MEMBERS !== 'undefined' ? MEMBERS.map((m,i)=>({...m, _src:'base', _idx:i})) : [];
    let customMembers = (JSON.parse(localStorage.getItem('opa_custom_members')) || []).map((m,i)=>({...m, _src:'custom', _idx:i}));
    return [...members, ...customMembers];
}

function renderAdminMembersTable() {
    const tbody = document.getElementById('admin-members-tbody');
    if (!tbody) return;
    const all = getAllMembersList();
    const onlineUser = currentUser ? currentUser.toLowerCase() : '';

    tbody.innerHTML = all.map((m, idx) => {
        const isOnline = onlineUser && ((m.nama||'').toLowerCase()===onlineUser || (m.realname||'').toLowerCase()===onlineUser);
        const onlineLabel = isOnline ? 'Online' : 'Offline';
        const onlineColor = isOnline ? 'var(--success)' : '#94a3b8';
        const statusLabel = m.status === 'diterima' ? 'Diterima' : 'Menunggu';
        const statusColor = m.status === 'diterima' ? 'var(--success)' : '#f97316';
        return `<tr>
            <td>${escapeHtml(m.nama)}</td>
            <td>${escapeHtml(m.id||'-')}</td>
            <td>${escapeHtml(m.gender||'-')}</td>
            <td>
                <select onchange="adminChangeRole(${idx}, this.value)" style="font-size:12px;padding:4px 6px;border-radius:6px;border:1px solid var(--border);">
                    ${['Leader','Admin','Officer','Anggota'].map(r=>`<option value="${r}" ${m.jabatan===r?'selected':''}>${r}</option>`).join('')}
                </select>
            </td>
            <td style="color:${onlineColor};font-weight:600;">${onlineLabel}</td>
            <td style="color:${statusColor};font-weight:600;">${statusLabel}</td>
            <td style="white-space:nowrap;">
                ${m.status !== 'diterima' ? `<button class="btn-primary btn-sm" onclick="approveMember(${idx})">Terima</button>` : ''}
                <button class="btn-outline btn-sm" style="color:#dc2626;border-color:#fecaca;" onclick="adminDeleteMember(${idx})">Hapus</button>
            </td>
        </tr>`;
    }).join('');
}

function approveMember(idx) {
    const all = getAllMembersList();
    const m = all[idx];
    if (!m) return;
    if (m._src === 'custom') {
        let custom = JSON.parse(localStorage.getItem('opa_custom_members')) || [];
        if (custom[m._idx]) { custom[m._idx].status = 'diterima'; localStorage.setItem('opa_custom_members', JSON.stringify(custom)); }
    }
    // base MEMBERS cannot be mutated permanently without members.js edit
    renderAdminMembersTable();
    renderAnggotaList();
    alert('Anggota berhasil diterima!');
}

function adminChangeRole(idx, role) {
    const all = getAllMembersList();
    const m = all[idx];
    if (!m) return;
    if (m._src === 'custom') {
        let custom = JSON.parse(localStorage.getItem('opa_custom_members')) || [];
        if (custom[m._idx]) { custom[m._idx].jabatan = role; localStorage.setItem('opa_custom_members', JSON.stringify(custom)); }
    }
    renderAdminMembersTable();
    renderAnggotaList();
}

function adminDeleteMember(idx) {
    if (!confirm('Yakin hapus anggota ini?')) return;
    const all = getAllMembersList();
    const m = all[idx];
    if (!m) return;
    if (m._src === 'custom') {
        let custom = JSON.parse(localStorage.getItem('opa_custom_members')) || [];
        custom.splice(m._idx, 1);
        localStorage.setItem('opa_custom_members', JSON.stringify(custom));
    } else {
        alert('Anggota bawaan (members.js) tidak bisa dihapus dari sini. Edit file members.js.');
        return;
    }
    renderAdminMembersTable();
    renderAnggotaList();
}

function adminAddMember() {
    const nick = document.getElementById('admin-new-nick')?.value.trim();
    const real = document.getElementById('admin-new-real')?.value.trim();
    const id = document.getElementById('admin-new-id')?.value.trim();
    const gender = document.getElementById('admin-new-gender')?.value || 'Laki-laki';
    const role = document.getElementById('admin-new-role')?.value || 'Anggota';
    if (!nick) return alert('Isi nickname!');
    let custom = JSON.parse(localStorage.getItem('opa_custom_members')) || [];
    custom.push({
        nama: nick.startsWith('OPA') ? nick : 'OPA • ' + nick,
        realname: real || nick,
        id: id || '-',
        jabatan: role,
        status: 'diterima',
        gender: gender,
        online: 'offline',
        tanggal: new Date().toLocaleDateString('id-ID')
    });
    localStorage.setItem('opa_custom_members', JSON.stringify(custom));
    ['admin-new-nick','admin-new-real','admin-new-id'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    renderAdminMembersTable();
    renderAnggotaList();
    alert('Anggota ditambahkan!');
}

// ========== UI CUSTOMIZATION ==========
function applyUITheme(theme) {
    document.body.classList.remove('theme-emerald', 'theme-purple', 'theme-dark');
    if (theme === 'emerald-green') document.body.classList.add('theme-emerald');
    else if (theme === 'royal-purple') document.body.classList.add('theme-purple');
    else if (theme === 'dark-minimal') document.body.classList.add('theme-dark');
}

function applyUINavbar(style) {
    if (style === 'compact') {
        document.body.classList.add('navbar-compact');
    } else {
        document.body.classList.remove('navbar-compact');
    }
}

function saveUISettings() {
    const theme = document.getElementById('ui-theme-select')?.value || 'warm-orange';
    const navbar = document.getElementById('ui-navbar-select')?.value || 'default';
    const logo = document.getElementById('ui-logo-input')?.value || 'logo.png';
    localStorage.setItem('opa_ui_theme', theme);
    localStorage.setItem('opa_ui_navbar', navbar);
    localStorage.setItem('opa_ui_logo', logo);
    
    applyUITheme(theme);
    applyUINavbar(navbar);
    
    // Apply logo if changed
    if (logo) {
        document.querySelectorAll('img[src*="logo"], .login-guild-logo, .home-guild-logo-img, .brand img').forEach(img => {
            if (img.id !== 'header-avatar') img.src = logo;
        });
    }
    
    alert('Kostumisasi UI berhasil disimpan!');
}

function loadUIPreferences() {
    const theme = localStorage.getItem('opa_ui_theme') || 'warm-orange';
    const navbar = localStorage.getItem('opa_ui_navbar') || 'default';
    const logo = localStorage.getItem('opa_ui_logo') || 'logo.png';
    
    const themeSelect = document.getElementById('ui-theme-select');
    const navbarSelect = document.getElementById('ui-navbar-select');
    const logoInput = document.getElementById('ui-logo-input');
    
    if (themeSelect) themeSelect.value = theme;
    if (navbarSelect) navbarSelect.value = navbar;
    if (logoInput) logoInput.value = logo;
    
    applyUITheme(theme);
    applyUINavbar(navbar);
}

// ========== CS BOT ==========
function renderCSMessages() {
    const box = document.getElementById('cs-messages-box');
    if (!box) return;
    let msgs = JSON.parse(localStorage.getItem('opa_cs_chat')) || [
        { sender: 'Help OPA • Police', text: 'Halo! Selamat datang di Pusat Bantuan Resmi Help OPA • Police. Silakan pilih salah satu menu di bawah.', time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) }
    ];
    box.innerHTML = msgs.map(m => {
        const isMe = m.sender === currentUser || m.sender === 'Tamu';
        return `
            <div class="chat-bubble ${isMe ? 'outgoing' : 'incoming'}">
                <div class="chat-meta">${escapeHtml(m.sender)} &bull; ${m.time}</div>
                <div>${m.text}</div>
            </div>
        `;
    }).join('');
    box.scrollTop = box.scrollHeight;
}

function openLoginCSModal() {
    alert('Pusat Bantuan CS Bot OPA • Police aktif.\n\nSilakan login terlebih dahulu untuk akses penuh.');
}

function csPush(userText, botText) {
    let msgs = JSON.parse(localStorage.getItem('opa_cs_chat')) || [];
    const now = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    if (userText) msgs.push({ sender: currentUser || 'Tamu', text: userText, time: now });
    if (botText) msgs.push({ sender: 'Help OPA • Police', text: botText, time: now });
    localStorage.setItem('opa_cs_chat', JSON.stringify(msgs));
    renderCSMessages();
}

function handleCSAction(type) {
    const formArea = document.getElementById('cs-form-area');
    if (formArea) { formArea.classList.add('hidden'); formArea.innerHTML = ''; }

    if (type === 'password') {
        csPush('1. Help Saya Mengganti Password',
            'Terimakasih Telah Menghubungi OPA • Police. Kami Paham Saat Melupakan Password/Username. Silahkan Isi Formulir Ini Supaya Kami Bisa Kirim Informasi Ini ke Admin Buat Di Proses.');
        showCSForm('Lupa Password');
    } else if (type === 'daftar') {
        csPush('2. Cara Daftar Anggota',
            'Panduan Daftar Anggota:<br>1. Buka menu <b>Registrasi Anggota</b><br>2. Baca & setujui semua syarat<br>3. Isi formulir data diri dengan benar<br>4. Kirim pendaftaran<br>5. Tunggu 1x24 jam, cek Status Anggota di menu Anggota');
    } else if (type === 'login') {
        csPush('3. Help Masalah Login',
            'Silahkan isi formulir di bawah agar Admin bisa membantu masalah login Anda.');
        showCSForm('Masalah Login');
    } else if (type === 'admin') {
        csPush('4. Hubungkan Ke Admin',
            'Permintaan terhubung ke Admin telah dicatat. Salah satu Admin (OPA • Maboo / OPA • Feyn) akan segera menghubungi Anda. Silakan cek juga menu Chat Grup & Pesan.');
    }
}

function showCSForm(laporanType) {
    const formArea = document.getElementById('cs-form-area');
    if (!formArea) return;
    formArea.classList.remove('hidden');
    formArea.innerHTML = `
        <h4 style="font-size:13px;margin-bottom:10px;">Isi Formulir — ${laporanType}</h4>
        <div class="input-group"><label>Nama</label><input type="text" id="cs-form-nama" placeholder="Nama lengkap / nickname"></div>
        <div class="input-group"><label>ID Game</label><input type="text" id="cs-form-id" placeholder="ID Free Fire"></div>
        <div class="input-group"><label>Username sebelumnya (opsional)</label><input type="text" id="cs-form-user" placeholder="Username lama"></div>
        <div class="input-group"><label>Laporan</label><input type="text" id="cs-form-laporan" value="${laporanType}" readonly></div>
        <button type="button" class="btn-primary btn-sm" onclick="submitCSForm('${laporanType}')">Kirim Formulir</button>
    `;
}

function submitCSForm(laporanType) {
    const nama = document.getElementById('cs-form-nama')?.value.trim();
    const id = document.getElementById('cs-form-id')?.value.trim();
    if (!nama || !id) return alert('Isi Nama dan ID Game!');
    const userOld = document.getElementById('cs-form-user')?.value.trim() || '-';

    // Simpan laporan ke localStorage agar admin bisa lihat
    let reports = JSON.parse(localStorage.getItem('opa_cs_reports')) || [];
    reports.push({ nama, id, userOld, laporan: laporanType, by: currentUser || 'Tamu', time: new Date().toLocaleString('id-ID') });
    localStorage.setItem('opa_cs_reports', JSON.stringify(reports));

    csPush(null, 'Terimakasih Sudah Mengisi Formulir Nya. Silahkan Menunggu 1x24jam, Laporan Kamu bakalan di Proses oleh Admin.');
    const formArea = document.getElementById('cs-form-area');
    if (formArea) { formArea.classList.add('hidden'); formArea.innerHTML = ''; }
}

function sendCSMessage() {
    const input = document.getElementById('cs-msg-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    csPush(text, 'Pesan kendala Anda telah diterima. Tim Admin akan segera memeriksa. Atau pilih menu bantuan di atas.');
    input.value = '';
}

function handleCSKey(e) { if (e.key === 'Enter') sendCSMessage(); }

function downloadOriginalApp() {
    alert('Mengunduh APK OPA OFFICIAL Original...\n\nFitur download akan tersedia setelah APK resmi diunggah.');
}
