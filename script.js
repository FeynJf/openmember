let currentUser = null;
let userRole = 'member';
let activePrivateChatUser = null;

if (!localStorage.getItem('opa_home_about')) {
    localStorage.setItem('opa_home_about', 'OPA Guild adalah aliansi game kompetitif yang mengutamakan solidaritas, kekompakan, dan dominasi di berbagai arena pertempuran game online.');
}

if (!localStorage.getItem('opa_members')) {
    localStorage.setItem('opa_members', JSON.stringify([
        { realname: 'Yosua Master', nickname: 'OPA・Yosua', id: '10001515', level: '99', role: 'Leader', status: 'offline', type: 'admin', avatar: '' },
        { realname: 'Feyn Master', nickname: 'OPA・Feyn', id: '10001516', level: '98', role: 'Admin', status: 'offline', type: 'admin', avatar: '' },
        { realname: 'Dimas Pratama', nickname: 'OPA・Vortex', id: '11223344', level: '85', role: 'Anggota', status: 'offline', type: 'member', avatar: '' }
    ]));
}

if (!localStorage.getItem('opa_waiting')) {
    localStorage.setItem('opa_waiting', JSON.stringify([]));
}

if (!localStorage.getItem('opa_chat_group')) {
    localStorage.setItem('opa_chat_group', JSON.stringify([
        { sender: 'OPA・Yosua', role: 'Leader', text: 'Selamat datang di obrolan grup OPA OFFICIAL! Silakan koordinasi mabar di sini.', avatar: '' }
    ]));
}

if (!localStorage.getItem('opa_inbox_messages')) {
    localStorage.setItem('opa_inbox_messages', JSON.stringify([]));
}

if (!localStorage.getItem('opa_private_chats')) {
    localStorage.setItem('opa_private_chats', JSON.stringify({}));
}

window.addEventListener('DOMContentLoaded', () => {
    let savedUser = localStorage.getItem('opa_current_user');
    let savedRole = localStorage.getItem('opa_current_role');
    if (savedUser) {
        currentUser = savedUser;
        userRole = savedRole || 'member';
        updateMemberStatus(currentUser, 'online');
        initSession();
    }
});

function switchAuthTab(type) {
    const loginForm = document.getElementById('form-login');
    const signupForm = document.getElementById('form-signup');
    const loginBtn = document.getElementById('tab-login-btn');
    const signupBtn = document.getElementById('tab-register-btn');
    const alertBox = document.getElementById('login-error-alert');
    if (alertBox) alertBox.classList.add('hidden');

    if (type === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        loginBtn.classList.add('active');
        signupBtn.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        signupBtn.classList.add('active');
        loginBtn.classList.remove('active');
    }
}

function generateRandomPassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$*!";
    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('signup-password').value = password;
}

function executeSignup() {
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!username || !password) {
        showLoginError("Harap isi username dan buat password acak terlebih dahulu!");
        return;
    }

    let users = JSON.parse(localStorage.getItem('opa_users')) || [];
    if (users.some(u => u.username === username)) {
        showLoginError("Username sudah digunakan orang lain, pilih yang lain!");
        return;
    }

    users.push({ username, password, role: 'Anggota', realname: username, id: '1000' + Math.floor(Math.random()*9000), level: '1' });
    localStorage.setItem('opa_users', JSON.stringify(users));

    showToast("Berhasil!", "Akun berhasil dibuat. Silakan login.");
    document.getElementById('signup-username').value = '';
    document.getElementById('signup-password').value = '';
    switchAuthTab('login');
}

function executeLogin() {
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    
    if (!usernameInput || !passwordInput) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const cleanUser = username.toLowerCase();

    if (!username || !password) {
        showLoginError("Harap masukkan username dan password!");
        return;
    }

    const isMasterAdmin = (
        (cleanUser === 'yosua' || cleanUser === 'opa・yosua' || cleanUser === 'feyn' || cleanUser === 'opa・feyn') && 
        (password === 'YosuaAdmin15' || password === 'FeynAdmin15')
    );

    if (isMasterAdmin) {
        currentUser = cleanUser.includes('feyn') ? 'OPA・Feyn' : 'OPA・Yosua';
        userRole = 'admin';
        saveSession();
        initSession();
        showToast("Berhasil!", "Selamat datang kembali, Master Admin!");
        return;
    }

    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    let foundMember = members.find(m => m.nickname.toLowerCase() === cleanUser || m.realname.toLowerCase() === cleanUser);
    if (foundMember && (password === 'YosuaAdmin15' || password === 'FeynAdmin15')) {
        currentUser = foundMember.nickname;
        userRole = foundMember.type === 'admin' ? 'admin' : 'member';
        saveSession();
        initSession();
        showToast("Berhasil!", `Selamat datang, ${currentUser}!`);
        return;
    }

    let users = JSON.parse(localStorage.getItem('opa_users')) || [];
    const foundUser = users.find(u => u.username.toLowerCase() === cleanUser && u.password === password);

    if (foundUser || (cleanUser === "admin" && password === "admin123")) {
        currentUser = foundUser ? foundUser.username : username;
        userRole = 'member';
        saveSession();
        initSession();
        showToast("Berhasil!", `Selamat datang, ${currentUser}!`);
    } else {
        showLoginError("Login Gagal! Username atau Password salah.");
    }
}

function showLoginError(msg) {
    const errBox = document.getElementById('login-error-alert');
    const errText = document.getElementById('error-text');
    if (errBox && errText) {
        errText.innerText = msg;
        errBox.classList.remove('hidden');
    }
}

function showToast(title, desc) {
    const toast = document.getElementById('toast-notification');
    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-desc').innerText = desc;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

function saveSession() {
    localStorage.setItem('opa_current_user', currentUser);
    localStorage.setItem('opa_current_role', userRole);
    updateMemberStatus(currentUser, 'online');
}

function updateMemberStatus(nickname, status) {
    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    members.forEach(m => {
        if (m.nickname.toLowerCase() === nickname.toLowerCase() || m.realname.toLowerCase() === nickname.toLowerCase()) {
            m.status = status;
        }
    });
    localStorage.setItem('opa_members', JSON.stringify(members));
}

function initSession() {
    document.getElementById('display-username').innerText = currentUser;
    document.getElementById('display-role').innerText = userRole === 'admin' ? 'Guild Master / Admin' : 'Member Guild';
    
    updateSidebarAvatar();

    if (userRole === 'admin') {
        document.getElementById('menu-admin-panel').classList.remove('hidden');
    } else {
        document.getElementById('menu-admin-panel').classList.add('hidden');
    }

    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    loadHomeContent();
    renderAllMembers();
    renderInboxMessages();
    renderGroupChat();
    loadContactPickerList();
    loadAdminPanelData();
}

function updateSidebarAvatar() {
    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    let me = members.find(m => m.nickname.toLowerCase() === currentUser.toLowerCase() || m.realname.toLowerCase() === currentUser.toLowerCase());
    let box = document.getElementById('user-avatar-box');
    if (me && me.avatar) {
        box.innerHTML = `<img src="${me.avatar}" alt="Avatar">`;
    } else {
        box.innerHTML = `<i class="fa-solid fa-user-shield"></i>`;
    }
}

function handleLogout() {
    if (currentUser) {
        updateMemberStatus(currentUser, 'offline');
    }
    currentUser = null;
    userRole = 'member';
    localStorage.removeItem('opa_current_user');
    localStorage.removeItem('opa_current_role');

    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    showToast("Berhasil", "Anda telah keluar dari akun.");
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

function toggleProfileModal() {
    const modal = document.getElementById('profile-modal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        let members = JSON.parse(localStorage.getItem('opa_members')) || [];
        let me = members.find(m => m.nickname.toLowerCase() === currentUser.toLowerCase() || m.realname.toLowerCase() === currentUser.toLowerCase());
        if (me) {
            document.getElementById('profile-realname').value = me.realname;
            document.getElementById('profile-nickname').value = me.nickname;
            document.getElementById('profile-old-password').value = '';
            document.getElementById('profile-new-password').value = '';
            let preview = document.getElementById('modal-avatar-preview');
            if (me.avatar) {
                preview.innerHTML = `<img src="${me.avatar}" alt="Avatar">`;
            } else {
                preview.innerHTML = `<i class="fa-solid fa-user-shield"></i>`;
            }
        }
    }
}

function closeProfileModal(e) {
    document.getElementById('profile-modal').classList.add('hidden');
}

let tempAvatarBase64 = '';
function previewAvatar(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(uploadEvent) {
            tempAvatarBase64 = uploadEvent.target.result;
            document.getElementById('modal-avatar-preview').innerHTML = `<img src="${tempAvatarBase64}" alt="Avatar">`;
        };
        reader.readAsDataURL(file);
    }
}

function saveProfileSettings(e) {
    e.preventDefault();
    const newReal = document.getElementById('profile-realname').value.trim();
    const newNick = document.getElementById('profile-nickname').value.trim();
    const oldPass = document.getElementById('profile-old-password').value;
    const newPass = document.getElementById('profile-new-password').value;

    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    let me = members.find(m => m.nickname.toLowerCase() === currentUser.toLowerCase() || m.realname.toLowerCase() === currentUser.toLowerCase());
    
    if (me) {
        me.realname = newReal;
        me.nickname = newNick;
        if (tempAvatarBase64) {
            me.avatar = tempAvatarBase64;
        }
    } else {
        members.push({ realname: newReal, nickname: newNick, id: '1000' + Math.floor(Math.random()*9000), level: '1', role: 'Anggota', status: 'online', type: 'member', avatar: tempAvatarBase64 });
    }

    let users = JSON.parse(localStorage.getItem('opa_users')) || [];
    let u = users.find(x => x.username.toLowerCase() === currentUser.toLowerCase());
    if (u) {
        u.username = newNick;
        if (newPass) u.password = newPass;
    } else if (newPass) {
        users.push({ username: newNick, password: newPass, role: 'Anggota', realname: newReal });
    }

    let inbox = JSON.parse(localStorage.getItem('opa_inbox_messages')) || [];
    let updateDesc = `Anggota **${newNick}** memperbarui profil akun.`;
    if (newPass) {
        updateDesc += ` **[PERMINTAAN UBAH PASSWORD]**: Password baru diubah menjadi '${newPass}'.`;
    }
    inbox.unshift({
        type: 'profile_update',
        sender: newNick,
        text: updateDesc,
        status: 'processing',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem('opa_inbox_messages', JSON.stringify(inbox));

    currentUser = newNick;
    localStorage.setItem('opa_current_user', currentUser);
    localStorage.setItem('opa_members', JSON.stringify(members));
    localStorage.setItem('opa_users', JSON.stringify(users));

    toggleProfileModal();
    initSession();
    renderGroupChat();
    renderInboxMessages();
    showToast("Berhasil!", "Perubahan profil & password berhasil disimpan dan dikirim ke Admin.");
}

function toggleContactModal() {
    const modal = document.getElementById('contact-picker-modal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        loadContactPickerList();
    }
}

function closeContactModal(e) {
    document.getElementById('contact-picker-modal').classList.add('hidden');
}

function loadContactPickerList(filterText = '') {
    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    let container = document.getElementById('contact-list-container');
    container.innerHTML = '';

    let filtered = members.filter(m => 
        m.nickname.toLowerCase().includes(filterText.toLowerCase()) || 
        m.realname.toLowerCase().includes(filterText.toLowerCase()) ||
        m.role.toLowerCase().includes(filterText.toLowerCase())
    );

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:#94a3b8; padding:20px;">Anggota tidak ditemukan.</p>`;
        return;
    }

    filtered.forEach(m => {
        let avatarHtml = m.avatar ? `<img src="${m.avatar}" alt="Avatar">` : `<i class="fa-solid fa-user"></i>`;
        container.innerHTML += `
            <div class="contact-item-row" onclick="openPrivateChatWith('${m.nickname}')">
                <div class="contact-info-left">
                    <div class="contact-avatar-sm">${avatarHtml}</div>
                    <div class="contact-details">
                        <h4>${m.nickname} <span class="role-badge" style="font-size:9px; padding:1px 6px;">${m.role}</span></h4>
                        <small>${m.realname} • ID: ${m.id}</small>
                    </div>
                </div>
                <i class="fa-solid fa-chevron-right" style="color:#38bdf8; font-size:12px;"></i>
            </div>
        `;
    });
}

function filterContactList() {
    let query = document.getElementById('contact-search-input').value;
    loadContactPickerList(query);
}

function openPrivateChatWith(memberName) {
    toggleContactModal();
    switchMessengerTab('notif', document.querySelectorAll('.messenger-tab-btn')[1]);
    activePrivateChatUser = memberName;

    document.getElementById('private-chat-title').innerText = memberName;
    document.getElementById('private-chat-subtitle').innerText = `Percakapan langsung dengan ${memberName}`;
    
    // TAMPILKAN INPUT PENGETIKAN DI DALAM CHAT
    document.getElementById('private-input-row').classList.remove('hidden');
    // SEMBUNYIKAN TOMBOL + DI LUAR
    document.getElementById('inbox-floating-plus').classList.add('hidden');

    renderPrivateChatMessages();
}

function renderPrivateChatMessages() {
    let box = document.getElementById('user-notification-box');
    let privateChats = JSON.parse(localStorage.getItem('opa_private_chats')) || {};
    let chatKey = getPrivateChatKey(currentUser, activePrivateChatUser || 'Admin');
    let messages = privateChats[chatKey] || [];

    box.innerHTML = '';

    if (!activePrivateChatUser) {
        renderInboxMessages();
        return;
    }

    // Tombol kembali ke daftar inbox luar
    box.innerHTML += `
        <div style="margin-bottom:6px;">
            <button class="btn-secondary" onclick="backToInboxList()" style="font-size:11px; padding:4px 10px;"><i class="fa-solid fa-arrow-left"></i> Kembali ke Kotak Masuk</button>
        </div>
    `;

    if (messages.length === 0) {
        box.innerHTML += `
            <div class="empty-inbox" style="padding:30px 10px;">
                <i class="fa-solid fa-comments"></i>
                <h4>Mulai Obrolan</h4>
                <p>Kirim pesan pribadi pertama Anda kepada ${activePrivateChatUser}.</p>
            </div>
        `;
        return;
    }

    messages.forEach(msg => {
        let isMe = msg.sender.toLowerCase() === currentUser.toLowerCase();
        box.innerHTML += `
            <div style="display:flex; justify-content:${isMe ? 'flex-end' : 'flex-start'}; margin-bottom:8px;">
                <div style="background:${isMe ? 'rgba(79,70,229,0.85)' : 'rgba(30,41,59,0.9)'}; padding:10px 14px; border-radius:12px; max-width:80%; border:1px solid rgba(56,189,248,0.2);">
                    <div style="font-size:10px; color:#38bdf8; margin-bottom:2px; font-weight:600;">${msg.sender} • ${msg.time}</div>
                    <div style="font-size:13px; color:#fff;">${msg.text}</div>
                </div>
            </div>
        `;
    });
    box.scrollTop = box.scrollHeight;
}

function backToInboxList() {
    activePrivateChatUser = null;
    document.getElementById('private-chat-title').innerText = `Pesan`;
    document.getElementById('private-chat-subtitle').innerText = `Kotak masuk & daftar chat pribadi`;
    
    // SEMBUNYIKAN INPUT DI LUAR DAN MUNCULKAN TOMBOL + DI LUAR
    document.getElementById('private-input-row').classList.add('hidden');
    document.getElementById('inbox-floating-plus').classList.remove('hidden');

    renderInboxMessages();
}

function getPrivateChatKey(userA, userB) {
    let sorted = [userA.toLowerCase(), userB.toLowerCase()].sort();
    return sorted.join('_vs_');
}

function sendPrivateMessage() {
    let input = document.getElementById('private-msg-input');
    let text = input.value.trim();
    if (!text) return;

    if (!activePrivateChatUser) {
        activePrivateChatUser = 'OPA・Yosua';
    }

    let privateChats = JSON.parse(localStorage.getItem('opa_private_chats')) || {};
    let chatKey = getPrivateChatKey(currentUser, activePrivateChatUser);
    if (!privateChats[chatKey]) privateChats[chatKey] = [];

    let nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    privateChats[chatKey].push({
        sender: currentUser,
        text: text,
        time: nowTime
    });
    localStorage.setItem('opa_private_chats', JSON.stringify(privateChats));

    // UPDATE ATAU TAMBAHKAN KE INBOX AGAR MUNCUL DI LUAR SEBAGAI THREAD PESAN
    let inbox = JSON.parse(localStorage.getItem('opa_inbox_messages')) || [];
    let existingIndex = inbox.findIndex(item => item.sender === activePrivateChatUser || (item.type === 'chat' && item.sender === activePrivateChatUser));
    
    if (existingIndex >= 0) {
        inbox[existingIndex].text = text;
        inbox[existingIndex].timestamp = nowTime;
        // Pindahkan ke urutan paling atas di inbox
        let item = inbox.splice(existingIndex, 1)[0];
        inbox.unshift(item);
    } else {
        inbox.unshift({
            type: 'chat',
            sender: activePrivateChatUser,
            text: text,
            status: 'approved',
            timestamp: nowTime
        });
    }
    localStorage.setItem('opa_inbox_messages', JSON.stringify(inbox));

    input.value = '';
    renderPrivateChatMessages();
    showToast("Berhasil", "Pesan pribadi terkirim.");
}

function handlePrivateKey(e) {
    if (e.key === 'Enter') {
        sendPrivateMessage();
    }
}

function renderInboxMessages() {
    if (activePrivateChatUser) {
        renderPrivateChatMessages();
        return;
    }

    // Pastikan di luar tidak ada input bar dan tombol + melayang muncul
    document.getElementById('private-input-row').classList.add('hidden');
    document.getElementById('inbox-floating-plus').classList.remove('hidden');

    let inbox = JSON.parse(localStorage.getItem('opa_inbox_messages')) || [];
    let box = document.getElementById('user-notification-box');
    let badge = document.getElementById('notif-dot-badge');

    box.innerHTML = '';

    if (inbox.length === 0) {
        badge.classList.add('hidden');
        box.innerHTML = `
            <div class="empty-inbox">
                <i class="fa-solid fa-inbox"></i>
                <h4>Kotak Pesan Kosong</h4>
                <p>Belum ada pesan atau pendaftaran masuk saat ini. Tekan tombol '+' di pojok kanan bawah untuk mulai chat.</p>
            </div>
        `;
        return;
    }

    badge.classList.remove('hidden');

    inbox.forEach((item, index) => {
        let statusBadge = '';
        let adminActionHtml = '';

        if (item.status === 'approved') {
            statusBadge = `<span style="background:rgba(16,185,129,0.2); color:#10b981; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700;">DI-APPROVE</span>`;
        } else if (item.status === 'processing') {
            statusBadge = `<span style="background:rgba(245,158,11,0.2); color:#f59e0b; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700;">PROSES</span>`;
        } else {
            statusBadge = `<span style="background:rgba(56,189,248,0.2); color:#38bdf8; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700;">BARU</span>`;
        }

        if (userRole === 'admin') {
            adminActionHtml = `
                <div class="admin-format-buttons" style="margin-top:6px;">
                    <button class="btn-format-approve" onclick="event.stopPropagation(); setInboxStatus(${index}, 'approved')">Format Di Approve</button>
                    <button class="btn-format-process" onclick="event.stopPropagation(); setInboxStatus(${index}, 'processing')">Format Di Proses</button>
                    <button class="btn-action-delete" onclick="event.stopPropagation(); deleteInboxItem(${index})" style="padding:4px 8px; font-size:10px;">Hapus</button>
                </div>
            `;
        }

        box.innerHTML += `
            <div class="glassmorphism" style="padding:14px 16px; border-radius:14px; display:flex; flex-direction:column; gap:6px; cursor:pointer; transition:0.2s;" onclick="openPrivateChatWith('${item.sender}')" onmouseover="this.style.background='rgba(56,189,248,0.1)'" onmouseout="this.style.background='rgba(15,23,42,0.95)'">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:13px; font-weight:600; color:#38bdf8;"><i class="fa-solid fa-user-circle"></i> ${item.sender}</span>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <span style="font-size:11px; color:#94a3b8;">${item.timestamp}</span>
                        ${statusBadge}
                    </div>
                </div>
                <p style="font-size:12px; color:#cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.text}</p>
                ${adminActionHtml}
            </div>
        `;
    });
}

function setInboxStatus(index, statusType) {
    let inbox = JSON.parse(localStorage.getItem('opa_inbox_messages')) || [];
    if (inbox[index]) {
        inbox[index].status = statusType;
        if (statusType === 'approved') {
            inbox[index].text = `Pesan/Pendaftaran ${inbox[index].sender} telah DI-APPROVE oleh Admin.`;
        } else {
            inbox[index].text = `Pesan/Pendaftaran ${inbox[index].sender} SEDANG DI PROSES oleh Admin.`;
        }
        localStorage.setItem('opa_inbox_messages', JSON.stringify(inbox));
        renderInboxMessages();
        showToast("Berhasil", "Format status pesan diperbarui.");
    }
}

function deleteInboxItem(index) {
    let inbox = JSON.parse(localStorage.getItem('opa_inbox_messages')) || [];
    inbox.splice(index, 1);
    localStorage.setItem('opa_inbox_messages', JSON.stringify(inbox));
    renderInboxMessages();
    showToast("Berhasil", "Pesan dihapus dari kotak masuk.");
}

function switchTab(tabId, element) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        li.classList.remove('active');
    });

    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    
    if (element) {
        element.classList.add('active');
    } else {
        const menus = document.querySelectorAll('.sidebar-menu li');
        if (tabId === 'home') menus[0]?.classList.add('active');
        if (tabId === 'anggota') menus[1]?.classList.add('active');
        if (tabId === 'registrasi') menus[2]?.classList.add('active');
        if (tabId === 'pesan') {
            menus[3]?.classList.add('active');
            document.getElementById('notif-dot-badge').classList.add('hidden');
        }
        if (tabId === 'adminpanel') menus[4]?.classList.add('active');
    }

    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

function switchSubAnggota(subType, element) {
    document.querySelectorAll('.sub-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.sub-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`sub-${subType}`).classList.remove('hidden');
    if (element) {
        element.classList.add('active');
    }
}

function switchMessengerTab(type, element) {
    document.querySelectorAll('.messenger-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('messenger-chat-pane').classList.add('hidden');
    document.getElementById('messenger-notif-pane').classList.add('hidden');

    element.classList.add('active');
    if (type === 'chat') {
        document.getElementById('messenger-chat-pane').classList.remove('hidden');
    } else {
        document.getElementById('messenger-notif-pane').classList.remove('hidden');
        backToInboxList();
    }
}

function nextRegStep(stepNumber) {
    document.querySelectorAll('.reg-step').forEach(step => step.classList.add('hidden'));
    document.getElementById(`reg-step-${stepNumber}`).classList.remove('hidden');
}

function loadHomeContent() {
    document.getElementById('home-about-text').innerText = localStorage.getItem('opa_home_about');
}

function submitRegistration() {
    const nickname = document.getElementById('reg-nickname').value;
    const realname = document.getElementById('reg-realname').value;
    const level = document.getElementById('reg-level').value;
    const idGame = document.getElementById('reg-id').value;
    const cn = document.getElementById('reg-cn').value;
    const gender = document.getElementById('reg-gender').value;
    const wa = document.getElementById('reg-wa').value;

    if (!nickname || !realname || !idGame) {
        showToast("Peringatan", "Harap isi data pendaftaran dengan lengkap.");
        return;
    }

    let waitingList = JSON.parse(localStorage.getItem('opa_waiting')) || [];
    waitingList.push({ username: currentUser, realname, nickname, id: idGame, level, cn, gender, wa, role: 'Anggota', status: 'offline', type: 'member', avatar: '' });
    localStorage.setItem('opa_waiting', JSON.stringify(waitingList));

    let inbox = JSON.parse(localStorage.getItem('opa_inbox_messages')) || [];
    inbox.unshift({
        type: 'registration',
        sender: nickname,
        realname: realname,
        text: `Pendaftaran baru dari ${nickname} (${realname}) menunggu persetujuan admin.`,
        status: 'pending',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem('opa_inbox_messages', JSON.stringify(inbox));

    renderAllMembers();
    renderInboxMessages();
    nextRegStep(4);
    showToast("Berhasil!", "Pendaftaran telah dikirim.");
}

function resetAndGoHome() {
    nextRegStep(1);
    switchTab('home');
}

function renderAllMembers() {
    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    let waiting = JSON.parse(localStorage.getItem('opa_waiting')) || [];

    let adminContainer = document.getElementById('admin-cards-container');
    let anggotaContainer = document.getElementById('anggota-cards-container');
    let waitingContainer = document.getElementById('waiting-cards-container');

    adminContainer.innerHTML = '';
    anggotaContainer.innerHTML = '';
    waitingContainer.innerHTML = '';

    let adminRoles = ['Leader', 'Admin', 'Co Leader', 'Officer'];
    let filteredAdmins = members.filter(m => adminRoles.includes(m.role) || m.type === 'admin');
    
    if (filteredAdmins.length === 0) {
        adminContainer.innerHTML = `<p style="color:#94a3b8;">Belum ada data admin.</p>`;
    } else {
        filteredAdmins.forEach(m => {
            adminContainer.innerHTML += createMemberCard(m);
        });
    }

    let filteredAnggota = members.filter(m => !adminRoles.includes(m.role) && m.type !== 'admin');
    if (filteredAnggota.length === 0) {
        anggotaContainer.innerHTML = `<p style="color:#94a3b8;">Belum ada anggota tetap.</p>`;
    } else {
        filteredAnggota.forEach(m => {
            anggotaContainer.innerHTML += createMemberCard(m);
        });
    }

    if (waiting.length === 0) {
        waitingContainer.innerHTML = `<p style="color:#94a3b8;">Tidak ada pendaftar menunggu.</p>`;
    } else {
        waiting.forEach((w, index) => {
            waitingContainer.innerHTML += createWaitingCard(w, index);
        });
    }
}

function createMemberCard(m) {
    let roleClass = 'role-member';
    if (m.role === 'Leader') roleClass = 'role-leader';
    else if (m.role === 'Admin') roleClass = 'role-admin';
    else if (m.role === 'Co Leader') roleClass = 'role-co-leader';
    else if (m.role === 'Officer') roleClass = 'role-officer';

    let statusClass = m.status === 'online' ? 'status-online' : 'status-offline';
    let statusText = m.status === 'online' ? 'Online' : 'Offline';

    return `
        <div class="member-card-item glassmorphism">
            <div class="member-card-row">
                <span>Name :</span>
                <span>${m.realname}</span>
            </div>
            <div class="member-card-row">
                <span>Nickname :</span>
                <span style="color:#38bdf8;">${m.nickname}</span>
            </div>
            <div class="member-card-row">
                <span>Id Game :</span>
                <span>${m.id}</span>
            </div>
            <div class="member-card-row">
                <span>Level Akun :</span>
                <span>${m.level}</span>
            </div>
            <div class="member-card-row">
                <span>Jabatan :</span>
                <span><span class="role-badge ${roleClass}">${m.role}</span></span>
            </div>
            <div class="member-card-row">
                <span>Status :</span>
                <span class="${statusClass}">${statusText}</span>
            </div>
            <div class="member-card-row" style="border:none; padding-top:4px;">
                <span>Approve :</span>
                <span style="color:#10b981; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Di Terima</span>
            </div>
        </div>
    `;
}

function createWaitingCard(w, index) {
    let actionBtn = userRole === 'admin' 
        ? `<button class="btn-action-accept" onclick="acceptMember(${index})"><i class="fa-solid fa-check"></i> Terima</button>`
        : `<span style="color:#f59e0b; font-weight:600;">Di Proses</span>`;

    return `
        <div class="member-card-item glassmorphism">
            <div class="member-card-row">
                <span>Name :</span>
                <span>${w.realname}</span>
            </div>
            <div class="member-card-row">
                <span>Nickname :</span>
                <span style="color:#38bdf8;">${w.nickname}</span>
            </div>
            <div class="member-card-row">
                <span>Id Game :</span>
                <span>${w.id}</span>
            </div>
            <div class="member-card-row">
                <span>Level Akun :</span>
                <span>${w.level}</span>
            </div>
            <div class="member-card-row">
                <span>Jabatan :</span>
                <span><span class="role-badge role-member">Calon Anggota</span></span>
            </div>
            <div class="member-card-row">
                <span>Status :</span>
                <span class="status-offline">Offline</span>
            </div>
            <div class="member-card-row" style="border:none; padding-top:4px;">
                <span>Approve :</span>
                <span>${actionBtn}</span>
            </div>
        </div>
    `;
}

function acceptMember(index) {
    let waiting = JSON.parse(localStorage.getItem('opa_waiting')) || [];
    let member = waiting.splice(index, 1)[0];
    localStorage.setItem('opa_waiting', JSON.stringify(waiting));

    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    members.push({ realname: member.realname, nickname: member.nickname, id: member.id, level: member.level, role: 'Anggota', status: 'offline', type: 'member', avatar: '' });
    localStorage.setItem('opa_members', JSON.stringify(members));

    let inbox = JSON.parse(localStorage.getItem('opa_inbox_messages')) || [];
    inbox.forEach(item => {
        if (item.sender === member.nickname) {
            item.status = 'approved';
            item.text = `Pendaftaran ${member.nickname} telah DI-APPROVE oleh Admin.`;
        }
    });
    localStorage.setItem('opa_inbox_messages', JSON.stringify(inbox));

    renderAllMembers();
    renderInboxMessages();
    loadAdminPanelData();
    showToast("Berhasil!", `${member.nickname} resmi menjadi anggota.`);
}

function renderGroupChat() {
    let chatBox = document.getElementById('chat-messages-box');
    let messages = JSON.parse(localStorage.getItem('opa_chat_group')) || [];
    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    chatBox.innerHTML = '';

    messages.forEach(msg => {
        let senderObj = members.find(m => m.nickname.toLowerCase() === msg.sender.toLowerCase() || m.realname.toLowerCase() === msg.sender.toLowerCase() || m.username?.toLowerCase() === msg.sender.toLowerCase());
        
        let currentAvatar = senderObj && senderObj.avatar ? senderObj.avatar : msg.avatar;
        let avatarImg = currentAvatar ? `<img src="${currentAvatar}" alt="Avatar">` : `<i class="fa-solid fa-user"></i>`;
        
        let senderName = senderObj ? senderObj.nickname : msg.sender;
        let roleName = senderObj ? senderObj.role : (msg.role || 'Anggota');
        
        let roleBadgeClass = 'role-member';
        if (roleName === 'Leader') roleBadgeClass = 'role-leader';
        else if (roleName === 'Admin') roleBadgeClass = 'role-admin';
        else if (roleName === 'Co Leader') roleBadgeClass = 'role-co-leader';
        else if (roleName === 'Officer') roleBadgeClass = 'role-officer';

        chatBox.innerHTML += `
            <div class="messenger-msg-item">
                <div class="msg-avatar">${avatarImg}</div>
                <div class="msg-body-box">
                    <div class="msg-header-row">
                        <span class="msg-sender-name">${senderName}</span>
                        <span class="msg-sender-role ${roleBadgeClass}">${roleName}</span>
                    </div>
                    <div class="msg-text-content">${msg.text}</div>
                </div>
            </div>
        `;
    });
    chatBox.scrollTop = chatBox.scrollHeight;
}

function sendGroupMessage() {
    let input = document.getElementById('chat-msg-input');
    let text = input.value.trim();
    if (!text) return;

    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    let me = members.find(m => m.nickname.toLowerCase() === currentUser.toLowerCase() || m.realname.toLowerCase() === currentUser.toLowerCase());
    let myRole = me ? me.role : (userRole === 'admin' ? 'Admin' : 'Anggota');
    let myAvatar = me && me.avatar ? me.avatar : '';

    let messages = JSON.parse(localStorage.getItem('opa_chat_group')) || [];
    messages.push({ sender: currentUser || 'Member', role: myRole, text: text, avatar: myAvatar });
    localStorage.setItem('opa_chat_group', JSON.stringify(messages));

    input.value = '';
    renderGroupChat();
    showToast("Berhasil!", "Pesan dikirim ke grup chat.");
}

function handleChatKey(e) {
    if (e.key === 'Enter') {
        sendGroupMessage();
    }
}

function loadAdminPanelData() {
    document.getElementById('edit-about').value = localStorage.getItem('opa_home_about');
    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    let tbody = document.getElementById('admin-manage-tbody');
    tbody.innerHTML = '';

    members.forEach((m, i) => {
        tbody.innerHTML += `
            <tr>
                <td><input type="text" value="${m.nickname}" id="edit-nick-${i}" style="background:rgba(2,6,23,0.5); border:1px solid rgba(56,189,248,0.2); color:#fff; padding:4px 8px; border-radius:6px; width:110px;"></td>
                <td><input type="text" value="${m.realname}" id="edit-real-${i}" style="background:rgba(2,6,23,0.5); border:1px solid rgba(56,189,248,0.2); color:#fff; padding:4px 8px; border-radius:6px; width:110px;"></td>
                <td><input type="text" value="${m.id}" id="edit-id-${i}" style="background:rgba(2,6,23,0.5); border:1px solid rgba(56,189,248,0.2); color:#fff; padding:4px 8px; border-radius:6px; width:90px;"></td>
                <td><input type="number" value="${m.level}" id="edit-lvl-${i}" style="background:rgba(2,6,23,0.5); border:1px solid rgba(56,189,248,0.2); color:#fff; padding:4px 8px; border-radius:6px; width:60px;"></td>
                <td>
                    <select id="edit-role-${i}" style="background:rgba(2,6,23,0.8); border:1px solid rgba(56,189,248,0.2); color:#fff; padding:4px 8px; border-radius:6px;">
                        <option value="Leader" ${m.role === 'Leader' ? 'selected' : ''}>Leader</option>
                        <option value="Admin" ${m.role === 'Admin' ? 'selected' : ''}>Admin</option>
                        <option value="Co Leader" ${m.role === 'Co Leader' ? 'selected' : ''}>Co Leader</option>
                        <option value="Officer" ${m.role === 'Officer' ? 'selected' : ''}>Officer</option>
                        <option value="Anggota" ${m.role === 'Anggota' ? 'selected' : ''}>Anggota</option>
                    </select>
                </td>
                <td>
                    <button class="btn-primary" style="padding:4px 10px; font-size:11px; margin-top:0;" onclick="saveMemberEdit(${i})">Simpan</button>
                    <button class="btn-action-delete" style="padding:4px 10px; font-size:11px;" onclick="deleteGuildMember(${i})">Hapus</button>
                </td>
            </tr>
        `;
    });
}

function handleAddMember() {
    const realname = document.getElementById('new-realname').value;
    const nickname = document.getElementById('new-nickname').value;
    const id = document.getElementById('new-id').value;
    const level = document.getElementById('new-level').value;
    const role = document.getElementById('new-role').value;

    if (!realname || !nickname) {
        showToast("Peringatan", "Isi data anggota dengan benar.");
        return;
    }

    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    let type = ['Leader', 'Admin', 'Co Leader', 'Officer'].includes(role) ? 'admin' : 'member';
    members.push({ realname, nickname, id, level, role, status: 'offline', type, avatar: '' });
    localStorage.setItem('opa_members', JSON.stringify(members));

    document.getElementById('new-realname').value = '';
    document.getElementById('new-nickname').value = '';
    document.getElementById('new-id').value = '';
    document.getElementById('new-level').value = '';

    renderAllMembers();
    loadAdminPanelData();
    showToast("Berhasil!", "Anggota baru ditambahkan.");
}

function saveMemberEdit(index) {
    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    members[index].nickname = document.getElementById(`edit-nick-${index}`).value;
    members[index].realname = document.getElementById(`edit-real-${index}`).value;
    members[index].id = document.getElementById(`edit-id-${index}`).value;
    members[index].level = document.getElementById(`edit-lvl-${index}`).value;
    members[index].role = document.getElementById(`edit-role-${index}`).value;

    if (['Leader', 'Admin', 'Co Leader', 'Officer'].includes(members[index].role)) {
        members[index].type = 'admin';
    } else {
        members[index].type = 'member';
    }

    localStorage.setItem('opa_members', JSON.stringify(members));
    renderAllMembers();
    showToast("Berhasil!", "Data anggota diperbarui.");
}

function deleteGuildMember(index) {
    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    members.splice(index, 1);
    localStorage.setItem('opa_members', JSON.stringify(members));
    renderAllMembers();
    loadAdminPanelData();
    showToast("Berhasil!", "Anggota dihapus.");
}

function handleUpdateHome() {
    const about = document.getElementById('edit-about').value;
    localStorage.setItem('opa_home_about', about);
    loadHomeContent();
    showToast("Berhasil!", "Informasi Home diperbarui.");
}
