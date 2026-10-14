let currentUser = null;
let userRole = 'member';

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

if (!localStorage.getItem('opa_user_statuses')) {
    localStorage.setItem('opa_user_statuses', JSON.stringify({}));
}

if (!localStorage.getItem('opa_chat_group')) {
    localStorage.setItem('opa_chat_group', JSON.stringify([
        { sender: 'OPA・Yosua', role: 'Leader', text: 'Selamat datang di obrolan grup OPA OFFICIAL! Silakan koordinasi mabar di sini.', avatar: '' }
    ]));
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
    renderUserNotification();
    renderGroupChat();
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
    const newReal = document.getElementById('profile-realname').value;
    const newNick = document.getElementById('profile-nickname').value;
    const newPass = document.getElementById('profile-new-password').value;

    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    let me = members.find(m => m.nickname.toLowerCase() === currentUser.toLowerCase() || m.realname.toLowerCase() === currentUser.toLowerCase());
    
    if (me) {
        me.realname = newReal;
        me.nickname = newNick;
        if (tempAvatarBase64) {
            me.avatar = tempAvatarBase64;
        }
    }

    let users = JSON.parse(localStorage.getItem('opa_users')) || [];
    let u = users.find(x => x.username.toLowerCase() === currentUser.toLowerCase());
    if (u) {
        u.username = newNick;
        if (newPass) u.password = newPass;
    }

    currentUser = newNick;
    localStorage.setItem('opa_current_user', currentUser);
    localStorage.setItem('opa_members', JSON.stringify(members));
    localStorage.setItem('opa_users', JSON.stringify(users));

    toggleProfileModal();
    initSession();
    showToast("Berhasil!", "Profil akun berhasil diperbarui.");
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

    let statuses = JSON.parse(localStorage.getItem('opa_user_statuses')) || {};
    statuses[currentUser] = 'pending';
    localStorage.setItem('opa_user_statuses', JSON.stringify(statuses));

    renderAllMembers();
    renderUserNotification();
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

    let statuses = JSON.parse(localStorage.getItem('opa_user_statuses')) || {};
    if (member.username) {
        statuses[member.username] = 'approved';
    }
    localStorage.setItem('opa_user_statuses', JSON.stringify(statuses));

    renderAllMembers();
    renderUserNotification();
    loadAdminPanelData();
    showToast("Berhasil!", `${member.nickname} resmi menjadi anggota.`);
}

function renderUserNotification() {
    let statuses = JSON.parse(localStorage.getItem('opa_user_statuses')) || {};
    let myStatus = statuses[currentUser] || 'none';
    let box = document.getElementById('user-notification-box');
    let badge = document.getElementById('notif-dot-badge');

    if (myStatus === 'approved' || userRole === 'admin') {
        badge.classList.add('hidden');
        box.innerHTML = `
            <div class="notif-box-item approved" style="background:rgba(16,185,129,0.1); border:1px solid #10b981; padding:16px; border-radius:12px;">
                <h4 style="color:#10b981; margin-bottom:6px;"><i class="fa-solid fa-circle-check"></i> Status: Di Terima / Approved</h4>
                <p style="font-size:13px; color:#cbd5e1;">Pendaftaran Anda telah disetujui oleh Admin guild OPA OFFICIAL.</p>
            </div>
        `;
    } else if (myStatus === 'pending') {
        badge.classList.remove('hidden');
        box.innerHTML = `
            <div class="notif-box-item pending" style="background:rgba(245,158,11,0.1); border:1px solid #f59e0b; padding:16px; border-radius:12px;">
                <h4 style="color:#f59e0b; margin-bottom:6px;"><i class="fa-solid fa-clock"></i> Status: Di Proses (Menunggu Admin)</h4>
                <p style="font-size:13px; color:#cbd5e1;">Data pendaftaran Anda sedang ditinjau oleh Admin.</p>
            </div>
        `;
    } else {
        badge.classList.add('hidden');
        box.innerHTML = `
            <div class="notif-box-item" style="background:rgba(56,189,248,0.1); border:1px solid #38bdf8; padding:16px; border-radius:12px;">
                <h4 style="color:#38bdf8; margin-bottom:6px;"><i class="fa-solid fa-circle-info"></i> Belum Mengisi Pendaftaran</h4>
                <p style="font-size:13px; color:#cbd5e1;">Silakan buka menu <strong>Registrasi Anggota</strong>.</p>
            </div>
        `;
    }
}

function renderGroupChat() {
    let chatBox = document.getElementById('chat-messages-box');
    let messages = JSON.parse(localStorage.getItem('opa_chat_group')) || [];
    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    chatBox.innerHTML = '';

    messages.forEach(msg => {
        let senderObj = members.find(m => m.nickname.toLowerCase() === msg.sender.toLowerCase() || m.realname.toLowerCase() === msg.sender.toLowerCase());
        let avatarImg = senderObj && senderObj.avatar ? `<img src="${senderObj.avatar}" alt="Avatar">` : `<i class="fa-solid fa-user"></i>`;
        let roleName = msg.role || (senderObj ? senderObj.role : 'Anggota');
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
                        <span class="msg-sender-name">${msg.sender}</span>
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
