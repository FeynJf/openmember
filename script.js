let currentUser = null;
let userRole = 'member';
let activePrivateChatUser = null;

if (!localStorage.getItem('opa_home_about')) {
    localStorage.setItem('opa_home_about', 'OPA Guild adalah aliansi game kompetitif yang mengutamakan solidaritas, kekompakan, dan dominasi di berbagai arena pertempuran game online.');
}

if (!localStorage.getItem('opa_members')) {
    localStorage.setItem('opa_members', JSON.stringify([
        { realname: 'Yosua Master', nickname: 'OPA・Yosua', id: '10001515', level: '99', role: 'Leader', status: 'online', type: 'admin', avatar: '' },
        { realname: 'Feyn Master', nickname: 'OPA・Feyn', id: '10001516', level: '98', role: 'Admin', status: 'online', type: 'admin', avatar: '' },
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

if (!localStorage.getItem('opa_home_extra_cards')) {
    localStorage.setItem('opa_home_extra_cards', JSON.stringify([]));
}

if (!localStorage.getItem('opa_reg_extra_fields')) {
    localStorage.setItem('opa_reg_extra_fields', JSON.stringify([]));
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

// Window beforeunload untuk mengubah status jadi offline
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        updateMemberStatus(currentUser, 'offline');
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

    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    members.push({ realname: username, nickname: username, id: '1000' + Math.floor(Math.random()*9000), level: '1', role: 'Anggota', status: 'offline', type: 'member', avatar: '' });
    localStorage.setItem('opa_members', JSON.stringify(members));

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
    if (foundMember && (password === 'YosuaAdmin15' || password === 'FeynAdmin15' || password === foundMember.id)) {
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
    }, 3500);
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
    renderDynamicRegistrationFields();
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
    }

    let users = JSON.parse(localStorage.getItem('opa_users')) || [];
    let u = users.find(x => x.username.toLowerCase() === currentUser.toLowerCase());
    if (u) {
        u.username = newNick;
        if (newPass) u.password = newPass;
    } else if (newPass) {
        users.push({ username: newNick, password: newPass, role: 'Anggota', realname: newReal });
    }

    currentUser = newNick;
    localStorage.setItem('opa_current_user', currentUser);
    localStorage.setItem('opa_members', JSON.stringify(members));
    localStorage.setItem('opa_users', JSON.stringify(users));

    toggleProfileModal();
    initSession();
    showToast("Berhasil!", "Profil berhasil diperbarui.");
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

// Emoji & Sticker Picker Logic
function toggleEmojiModal() {
    const modal = document.getElementById('emoji-picker-modal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        loadEmojiAndStickers();
    }
}

function closeEmojiModal(e) {
    document.getElementById('emoji-picker-modal').classList.add('hidden');
}

function switchEmojiTab(type, el) {
    document.querySelectorAll('.emoji-tabs .sub-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    if (type === 'emoji') {
        document.getElementById('emoji-pane').classList.remove('hidden');
        document.getElementById('sticker-pane').classList.add('hidden');
    } else {
        document.getElementById('emoji-pane').classList.add('hidden');
        document.getElementById('sticker-pane').classList.remove('hidden');
    }
}

function loadEmojiAndStickers() {
    let emojiPane = document.getElementById('emoji-pane');
    let stickerPane = document.getElementById('sticker-pane');
    emojiPane.innerHTML = '';
    stickerPane.innerHTML = '';

    const emojis = ['😀','😂','🔥','❤️','👍','😎','🙌','⭐','💯','👑','🛡️','💻','🎮','🏆','⚡','🚀','💎','✨','🎉','👋','😅','😉','😍','🥳','😎'];
    emojis.forEach(em => {
        emojiPane.innerHTML += `<div class="emoji-item" onclick="insertEmoji('${em}')">${em}</div>`;
    });

    const stickers = ['[Stiker Mabar] 🎮', '[Stiker Guild War] ⚔️', '[Stiker Mantap] 👍', '[Stiker GGWP] 🔥', '[Stiker Hormat] 👑'];
    stickers.forEach(st => {
        stickerPane.innerHTML += `<div class="sticker-item" onclick="insertEmoji('${st}')">${st}</div>`;
    });
}

function insertEmoji(symbol) {
    let input = activePrivateChatUser === 'Help OPA • Police' ? document.getElementById('cs-msg-input') : document.getElementById('private-msg-input');
    if (input) {
        input.value += symbol;
        input.focus();
    }
    toggleEmojiModal();
}

function sendAttachmentFile(e) {
    const file = e.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(uploadEvent) {
            let fileBase64 = uploadEvent.target.result;
            let textMsg = `[File/Foto Dilampirkan: ${file.name}]`;
            if (activePrivateChatUser === 'Help OPA • Police') {
                sendCSMessageCustom(textMsg);
            } else {
                sendPrivateMessageCustom(textMsg);
            }
        };
        reader.readAsDataURL(file);
    }
}

// ================= CUSTOMER SERVICE BOT: HELP OPA • POLICE =================
function openCustomerServiceBot() {
    switchTab('pesan');
    switchMessengerTab('notif', document.querySelectorAll('.messenger-tab-btn')[1]);
    activePrivateChatUser = 'Help OPA • Police';

    document.getElementById('private-chat-title').innerText = 'Help OPA • Police (CS Bot)';
    document.getElementById('private-chat-subtitle').innerText = 'Pusat Bantuan & Layanan Otomatis Guild';
    document.getElementById('private-input-row').classList.remove('hidden');
    document.getElementById('inbox-floating-plus').classList.add('hidden');

    // Inisialisasi obrolan bot jika belum ada
    let privateChats = JSON.parse(localStorage.getItem('opa_private_chats')) || {};
    let chatKey = getPrivateChatKey(currentUser, 'Help OPA • Police');
    if (!privateChats[chatKey] || privateChats[chatKey].length === 0) {
        privateChats[chatKey] = [
            {
                sender: 'Help OPA • Police',
                text: 'Halo ' + currentUser + '! Selamat datang di Pusat Bantuan Resmi **Help OPA • Police**. Silakan pilih salah satu menu bantuan di bawah ini atau ketik pesan:',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isBotMenu: true
            }
        ];
        localStorage.setItem('opa_private_chats', JSON.stringify(privateChats));
    }
    renderPrivateChatMessages();
}

function handleCSBotAction(actionType) {
    let privateChats = JSON.parse(localStorage.getItem('opa_private_chats')) || {};
    let chatKey = getPrivateChatKey(currentUser, 'Help OPA • Police');
    if (!privateChats[chatKey]) privateChats[chatKey] = [];

    let nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (actionType === 'password') {
        privateChats[chatKey].push({ sender: currentUser, text: '1. Help Saya Mengganti Password', time: nowTime });
        privateChats[chatKey].push({
            sender: 'Help OPA • Police',
            text: 'Terimakasih Telah Menghubungi OPA • Police. Kami Paham Saat Melupakan Password/Username Kamu. Silahkan Kamu Isi Formulir Ini Supaya Kami Bisa Kirim Informasi Ini ke Admin Buat Di Proses.<br><br>' +
                  '<div class="cs-form-box" style="background:rgba(2,6,23,0.8); padding:12px; border-radius:10px; margin-top:8px;">' +
                  '<div class="input-group"><label>Nama</label><input type="text" id="cs-f-name" value="' + currentUser + '"></div>' +
                  '<div class="input-group"><label>Id Game</label><input type="text" id="cs-f-id" placeholder="Masukkan ID Game..."></div>' +
                  '<div class="input-group"><label>Username sebelumnya (opsional)</label><input type="text" id="cs-f-old" placeholder="Username lama..."></div>' +
                  '<div class="input-group"><label>Laporan</label><input type="text" id="cs-f-report" value="Lupa Password" readonly></div>' +
                  '<button class="btn-primary" onclick="submitCSForm('Lupa Password')">Kirim Formulir Bantuan</button>' +
                  '</div>',
            time: nowTime
        });
    } else if (actionType === 'daftar') {
        privateChats[chatKey].push({ sender: currentUser, text: '2. Cara Daftar Anggota', time: nowTime });
        privateChats[chatKey].push({
            sender: 'Help OPA • Police',
            text: 'Berikut adalah panduan cara daftar anggota OPA Guild:<br>1. Buka menu <strong>Registrasi Anggota</strong> di sidebar.<br>2. Baca syarat dan ketentuan guild.<br>3. Isi formulir data diri dengan lengkap (Nickname wajib menggunakan format <strong>OPA・</strong>).<br>4. Kirim pendaftaran dan tunggu persetujuan dari Admin Guild.',
            time: nowTime
        });
    } else if (actionType === 'login') {
        privateChats[chatKey].push({ sender: currentUser, text: '3. Help Masalah login', time: nowTime });
        privateChats[chatKey].push({
            sender: 'Help OPA • Police',
            text: 'Terimakasih Telah Menghubungi OPA • Police. Silakan isi formulir kendala login di bawah ini:<br><br>' +
                  '<div class="cs-form-box" style="background:rgba(2,6,23,0.8); padding:12px; border-radius:10px; margin-top:8px;">' +
                  '<div class="input-group"><label>Nama</label><input type="text" id="cs-f-name" value="' + currentUser + '"></div>' +
                  '<div class="input-group"><label>Id Game</label><input type="text" id="cs-f-id" placeholder="Masukkan ID Game..."></div>' +
                  '<div class="input-group"><label>Username sebelumnya (opsional)</label><input type="text" id="cs-f-old" placeholder="Username lama..."></div>' +
                  '<div class="input-group"><label>Laporan</label><input type="text" id="cs-f-report" value="Masalah Login" readonly></div>' +
                  '<button class="btn-primary" onclick="submitCSForm('Masalah Login')">Kirim Formulir Bantuan</button>' +
                  '</div>',
            time: nowTime
        });
    } else if (actionType === 'admin') {
        privateChats[chatKey].push({ sender: currentUser, text: '4. Hubungkan Ke admin', time: nowTime });
        privateChats[chatKey].push({
            sender: 'Help OPA • Police',
            text: 'Baik, Anda sedang dihubungkan langsung ke Admin Guild (OPA・Yosua). Silakan ketik pesan Anda di bawah.',
            time: nowTime
        });
        activePrivateChatUser = 'OPA・Yosua';
    }

    localStorage.setItem('opa_private_chats', JSON.stringify(privateChats));
    renderPrivateChatMessages();
}

function submitCSForm(reportType) {
    let name = document.getElementById('cs-f-name')?.value || currentUser;
    let idGame = document.getElementById('cs-f-id')?.value || '-';
    let oldUser = document.getElementById('cs-f-old')?.value || '-';

    let nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let privateChats = JSON.parse(localStorage.getItem('opa_private_chats')) || {};
    let chatKey = getPrivateChatKey(currentUser, 'Help OPA • Police');
    
    privateChats[chatKey].push({
        sender: currentUser,
        text: `[Kirim Formulir CS]<br>Nama: ${name}<br>ID Game: ${idGame}<br>Username Lama: ${oldUser}<br>Laporan: ${reportType}`,
        time: nowTime
    });

    privateChats[chatKey].push({
        sender: 'Help OPA • Police',
        text: 'Terimakasih Sudah Mengisi Formulir Nya Silahkan Menunggu 1x24jam, Laporan Kamu bakalan di Proses.',
        time: nowTime
    });
    localStorage.setItem('opa_private_chats', JSON.stringify(privateChats));

    // Kirim juga ke inbox admin agar admin tahu laporan kendala member
    let inbox = JSON.parse(localStorage.getItem('opa_inbox_messages')) || [];
    inbox.unshift({
        type: 'cs_report',
        sender: currentUser,
        text: `[Laporan CS - ${reportType}] Nama: ${name}, ID: ${idGame}, OldUser: ${oldUser}`,
        status: 'processing',
        timestamp: nowTime
    });
    localStorage.setItem('opa_inbox_messages', JSON.stringify(inbox));

    renderPrivateChatMessages();
    showToast("Berhasil", "Formulir bantuan terkirim ke Admin.");
}

function sendCSMessageCustom(text) {
    let nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let privateChats = JSON.parse(localStorage.getItem('opa_private_chats')) || {};
    let chatKey = getPrivateChatKey(currentUser, 'Help OPA • Police');
    if (!privateChats[chatKey]) privateChats[chatKey] = [];

    privateChats[chatKey].push({ sender: currentUser, text: text, time: nowTime });
    privateChats[chatKey].push({
        sender: 'Help OPA • Police',
        text: 'Pesan Anda telah diterima oleh Bot Bantuan. Silakan pilih menu di bawah atau ketik angka 1-4.',
        time: nowTime
    });
    localStorage.setItem('opa_private_chats', JSON.stringify(privateChats));
    renderPrivateChatMessages();
}

function openPrivateChatWith(memberName) {
    toggleContactModal();
    switchMessengerTab('notif', document.querySelectorAll('.messenger-tab-btn')[1]);
    activePrivateChatUser = memberName;

    document.getElementById('private-chat-title').innerText = memberName;
    document.getElementById('private-chat-subtitle').innerText = `Percakapan langsung dengan ${memberName}`;
    
    document.getElementById('private-input-row').classList.remove('hidden');
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

    // Tombol kembali ke inbox luar
    box.innerHTML += `
        <div style="margin-bottom:8px;">
            <button class="btn-secondary" onclick="backToInboxList()" style="font-size:11px; padding:4px 10px;"><i class="fa-solid fa-arrow-left"></i> Kembali ke Kotak Masuk</button>
        </div>
    `;

    // Jika sedang di Help OPA Police, tampilkan 4 tombol utama di atas kolom ngetik secara rapi berjejer
    if (activePrivateChatUser === 'Help OPA • Police') {
        box.innerHTML += `
            <div class="cs-buttons-grid" style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px; background:rgba(2,6,23,0.6); padding:10px; border-radius:12px; border:1px solid rgba(56,189,248,0.2);">
                <small style="color:#38bdf8; font-weight:600; margin-bottom:4px;"><i class="fa-solid fa-robot"></i> Pilih Menu Bantuan OPA Police:</small>
                <button class="sub-btn" style="text-align:left; background:rgba(56,189,248,0.15);" onclick="handleCSBotAction('password')">1. Help Saya Mengganti Password</button>
                <button class="sub-btn" style="text-align:left; background:rgba(56,189,248,0.15);" onclick="handleCSBotAction('daftar')">2. Cara Daftar Anggota</button>
                <button class="sub-btn" style="text-align:left; background:rgba(56,189,248,0.15);" onclick="handleCSBotAction('login')">3. Help Masalah login</button>
                <button class="sub-btn" style="text-align:left; background:rgba(16,185,129,0.2); color:#10b981;" onclick="handleCSBotAction('admin')">4. Hubungkan Ke admin</button>
            </div>
        `;
    }

    if (messages.length === 0) {
        box.innerHTML += `
            <div class="empty-inbox" style="padding:20px 10px;">
                <i class="fa-solid fa-comments"></i>
                <h4>Mulai Obrolan</h4>
                <p>Kirim pesan pertama Anda.</p>
            </div>
        `;
        return;
    }

    messages.forEach(msg => {
        let isMe = msg.sender.toLowerCase() === currentUser.toLowerCase();
        box.innerHTML += `
            <div style="display:flex; justify-content:${isMe ? 'flex-end' : 'flex-start'}; margin-bottom:8px;">
                <div style="background:${isMe ? 'rgba(79,70,229,0.85)' : 'rgba(30,41,59,0.9)'}; padding:10px 14px; border-radius:12px; max-width:85%; border:1px solid rgba(56,189,248,0.2);">
                    <div style="font-size:10px; color:#38bdf8; margin-bottom:2px; font-weight:600;">${msg.sender} • ${msg.time}</div>
                    <div style="font-size:12px; color:#fff; line-height:1.4;">${msg.text}</div>
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

    if (activePrivateChatUser === 'Help OPA • Police') {
        sendCSMessageCustom(text);
        input.value = '';
        return;
    }

    sendPrivateMessageCustom(text);
    input.value = '';
}

function sendPrivateMessageCustom(text) {
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

    let inbox = JSON.parse(localStorage.getItem('opa_inbox_messages')) || [];
    let existingIndex = inbox.findIndex(item => item.sender === activePrivateChatUser || (item.type === 'chat' && item.sender === activePrivateChatUser));
    
    if (existingIndex >= 0) {
        inbox[existingIndex].text = text;
        inbox[existingIndex].timestamp = nowTime;
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

    renderPrivateChatMessages();
    showToast("Berhasil", "Pesan terkirim.");
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
                <p>Belum ada pesan masuk. Tekan tombol '+' di bawah untuk mulai chat.</p>
            </div>
        `;
        return;
    }

    badge.classList.remove('hidden');

    inbox.forEach((item, index) => {
        let statusBadge = '';
        if (item.status === 'approved') {
            statusBadge = `<span style="background:rgba(16,185,129,0.2); color:#10b981; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700;">DI-APPROVE</span>`;
        } else if (item.status === 'processing') {
            statusBadge = `<span style="background:rgba(245,158,11,0.2); color:#f59e0b; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700;">PROSES</span>`;
        } else {
            statusBadge = `<span style="background:rgba(56,189,248,0.2); color:#38bdf8; padding:2px 8px; border-radius:6px; font-size:10px; font-weight:700;">BARU</span>`;
        }

        // Format approve / tombol admin dipindah ke dalam / di-handle saat di dalam chat pribadi
        box.innerHTML += `
            <div class="glassmorphism" style="padding:14px 16px; border-radius:14px; display:flex; flex-direction:column; gap:6px; cursor:pointer; transition:0.2s;" onclick="openPrivateChatWith('${item.sender}')">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:12px; font-weight:600; color:#38bdf8;"><i class="fa-solid fa-user-circle"></i> ${item.sender}</span>
                    <div style="display:flex; gap:6px; align-items:center;">
                        <span style="font-size:10px; color:#94a3b8;">${item.timestamp}</span>
                        ${statusBadge}
                    </div>
                </div>
                <p style="font-size:11px; color:#cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.text}</p>
            </div>
        `;
    });
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
        if (tabId === 'adminpanel') menus[5]?.classList.add('active');
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
    
    // Render extra home cards
    let container = document.getElementById('home-extra-sections-container');
    let extraCards = JSON.parse(localStorage.getItem('opa_home_extra_cards')) || [];
    container.innerHTML = '';

    extraCards.forEach((card, idx) => {
        container.innerHTML += `
            <div class="card glassmorphism text-center-card" style="position:relative;">
                ${userRole === 'admin' ? `<button class="btn-action-delete" style="position:absolute; top:10px; right:10px; font-size:9px; padding:2px 6px;" onclick="deleteHomeCard(${idx})">Hapus</button>` : ''}
                <h3><i class="fa-solid fa-star"></i> ${card.title}</h3>
                <p style="font-size:12px; color:#cbd5e1; margin-top:8px;">${card.content}</p>
            </div>
        `;
    });
}

function handleAddHomeCard() {
    let title = document.getElementById('new-home-card-title').value.trim();
    let content = document.getElementById('new-home-card-content').value.trim();
    if (!title || !content) {
        showToast("Peringatan", "Judul dan konten kolom home harus diisi.");
        return;
    }

    let extraCards = JSON.parse(localStorage.getItem('opa_home_extra_cards')) || [];
    extraCards.push({ title, content });
    localStorage.setItem('opa_home_extra_cards', JSON.stringify(extraCards));

    document.getElementById('new-home-card-title').value = '';
    document.getElementById('new-home-card-content').value = '';
    loadHomeContent();
    showToast("Berhasil", "Kolom baru ditambahkan ke Home.");
}

function deleteHomeCard(index) {
    let extraCards = JSON.parse(localStorage.getItem('opa_home_extra_cards')) || [];
    extraCards.splice(index, 1);
    localStorage.setItem('opa_home_extra_cards', JSON.stringify(extraCards));
    loadHomeContent();
    showToast("Berhasil", "Kolom Home dihapus.");
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

function renderDynamicRegistrationFields() {
    let listContainer = document.getElementById('current-reg-fields-list');
    let extraFields = JSON.parse(localStorage.getItem('opa_reg_extra_fields')) || [];
    listContainer.innerHTML = '';
    if (extraFields.length === 0) {
        listContainer.innerHTML = `<span>Belum ada field tambahan.</span>`;
        return;
    }
    extraFields.forEach((f, idx) => {
        listContainer.innerHTML += `<div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px;"><span>• ${f}</span> <button class="btn-action-delete" style="font-size:9px; padding:2px 6px;" onclick="deleteRegField(${idx})">Hapus</button></div>`;
    });
}

function handleAddRegistrationField() {
    let fieldName = document.getElementById('new-reg-field-name').value.trim();
    if (!fieldName) return;
    let extraFields = JSON.parse(localStorage.getItem('opa_reg_extra_fields')) || [];
    extraFields.push(fieldName);
    localStorage.setItem('opa_reg_extra_fields', JSON.stringify(extraFields));
    document.getElementById('new-reg-field-name').value = '';
    renderDynamicRegistrationFields();
    showToast("Berhasil", "Field registrasi ditambahkan.");
}

function deleteRegField(index) {
    let extraFields = JSON.parse(localStorage.getItem('opa_reg_extra_fields')) || [];
    extraFields.splice(index, 1);
    localStorage.setItem('opa_reg_extra_fields', JSON.stringify(extraFields));
    renderDynamicRegistrationFields();
    showToast("Berhasil", "Field registrasi dihapus.");
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
        let senderObj = members.find(m => m.nickname.toLowerCase() === msg.sender.toLowerCase() || m.realname.toLowerCase() === msg.sender.toLowerCase());
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
}

function handleChatKey(e) {
    if (e.key === 'Enter') {
        sendGroupMessage();
    }
}

function loadAdminPanelData() {
    document.getElementById('edit-about').value = localStorage.getItem('opa_home_about');
    let members = JSON.parse(localStorage.getItem('opa_members')) || [];
    let users = JSON.parse(localStorage.getItem('opa_users')) || [];
    let tbody = document.getElementById('admin-manage-tbody');
    tbody.innerHTML = '';

    members.forEach((m, i) => {
        let u = users.find(x => x.username.toLowerCase() === m.nickname.toLowerCase());
        let currentPass = u ? u.password : 'YosuaAdmin15';

        tbody.innerHTML += `
            <tr>
                <td><input type="text" value="${m.nickname}" id="edit-nick-${i}" style="background:rgba(2,6,23,0.5); border:1px solid rgba(56,189,248,0.2); color:#fff; padding:4px 8px; border-radius:6px; width:100px;"></td>
                <td><input type="text" value="${m.realname}" id="edit-real-${i}" style="background:rgba(2,6,23,0.5); border:1px solid rgba(56,189,248,0.2); color:#fff; padding:4px 8px; border-radius:6px; width:100px;"></td>
                <td><input type="text" value="${m.id}" id="edit-id-${i}" style="background:rgba(2,6,23,0.5); border:1px solid rgba(56,189,248,0.2); color:#fff; padding:4px 8px; border-radius:6px; width:80px;"></td>
                <td><input type="number" value="${m.level}" id="edit-lvl-${i}" style="background:rgba(2,6,23,0.5); border:1px solid rgba(56,189,248,0.2); color:#fff; padding:4px 8px; border-radius:6px; width:50px;"></td>
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
                    <input type="text" value="${currentPass}" id="edit-pass-${i}" placeholder="Pass baru" style="background:rgba(2,6,23,0.5); border:1px solid rgba(56,189,248,0.2); color:#fff; padding:4px 8px; border-radius:6px; width:110px;">
                </td>
                <td>
                    <button class="btn-primary" style="padding:4px 8px; font-size:10px; margin-top:0;" onclick="saveMemberEdit(${i})">Simpan</button>
                    <button class="btn-action-delete" style="padding:4px 8px; font-size:10px;" onclick="deleteGuildMember(${i})">Hapus</button>
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

    let users = JSON.parse(localStorage.getItem('opa_users')) || [];
    users.push({ username: nickname, password: 'YosuaAdmin15', role, realname });
    localStorage.setItem('opa_users', JSON.stringify(users));

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
    let oldNick = members[index].nickname;
    
    let newNick = document.getElementById(`edit-nick-${index}`).value;
    let newReal = document.getElementById(`edit-real-${index}`).value;
    let newId = document.getElementById(`edit-id-${index}`).value;
    let newLvl = document.getElementById(`edit-lvl-${index}`).value;
    let newRole = document.getElementById(`edit-role-${index}`).value;
    let newPass = document.getElementById(`edit-pass-${index}`).value;

    members[index].nickname = newNick;
    members[index].realname = newReal;
    members[index].id = newId;
    members[index].level = newLvl;
    members[index].role = newRole;
    members[index].type = ['Leader', 'Admin', 'Co Leader', 'Officer'].includes(newRole) ? 'admin' : 'member';
    localStorage.setItem('opa_members', JSON.stringify(members));

    let users = JSON.parse(localStorage.getItem('opa_users')) || [];
    let u = users.find(x => x.username.toLowerCase() === oldNick.toLowerCase());
    if (u) {
        u.username = newNick;
        if (newPass) u.password = newPass;
    } else if (newPass) {
        users.push({ username: newNick, password: newPass, role: newRole, realname: newReal });
    }
    localStorage.setItem('opa_users', JSON.stringify(users));

    renderAllMembers();
    loadAdminPanelData();
    showToast("Berhasil!", "Data & password anggota diperbarui.");
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
