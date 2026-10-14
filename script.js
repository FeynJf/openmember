let currentUser = null;
let userRole = 'member';

if (!localStorage.getItem('opa_home_about')) {
    localStorage.setItem('opa_home_about', 'OPA Guild adalah aliansi game kompetitif yang mengutamakan solidaritas, kekompakan, dan dominasi di berbagai arena pertempuran game online.');
}
if (!localStorage.getItem('opa_home_info')) {
    localStorage.setItem('opa_home_info', '<li>🔥 <strong>Event Guild War</strong>: Jadwal tanding minggu ini pukul 20.00 WIB.</li><li>⚠️ <strong>Wajib CN</strong>: Anggota baru wajib menggunakan format tag <strong>OPA・</strong>.</li><li>💬 Gunakan menu Pesan untuk melihat status pendaftaran Anda.</li>');
}

if (!localStorage.getItem('opa_admins')) {
    localStorage.setItem('opa_admins', JSON.stringify([
        { realname: 'Yosua Master', nickname: 'OPA・Yosua', id: '10001515', level: '99', status: 'admin' }
    ]));
}

if (!localStorage.getItem('opa_anggota')) {
    localStorage.setItem('opa_anggota', JSON.stringify([
        { realname: 'Dimas Pratama', nickname: 'OPA・Vortex', id: '11223344', level: '85', status: 'anggota' }
    ]));
}

if (!localStorage.getItem('opa_waiting')) {
    localStorage.setItem('opa_waiting', JSON.stringify([]));
}

if (!localStorage.getItem('opa_user_statuses')) {
    localStorage.setItem('opa_user_statuses', JSON.stringify({}));
}

if (!localStorage.getItem('opa_broadcasts')) {
    localStorage.setItem('opa_broadcasts', JSON.stringify([
        { text: 'Selamat datang di OPA OFFICIAL! Silakan cek status pendaftaran Anda di menu Pesan & Notifikasi.', time: 'Baru saja' }
    ]));
}

function switchAuthTab(type) {
    const loginForm = document.getElementById('form-login');
    const signupForm = document.getElementById('form-signup');
    const loginBtn = document.getElementById('tab-login-btn');
    const signupBtn = document.getElementById('tab-register-btn');

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

function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;

    if (!username || !password) {
        alert("Harap isi username dan buat password acak terlebih dahulu!");
        return;
    }

    let users = JSON.parse(localStorage.getItem('opa_users')) || [];
    
    if (users.some(u => u.username === username)) {
        alert("Username sudah digunakan orang lain, pilih yang lain!");
        return;
    }

    users.push({ username, password });
    localStorage.setItem('opa_users', JSON.stringify(users));

    alert("Akun berhasil dibuat! Silakan login menggunakan password acak Anda.");
    document.getElementById('signup-username').value = '';
    document.getElementById('signup-password').value = '';
    switchAuthTab('login');
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    const cleanUser = username.toLowerCase();
    const isMasterAdmin = (
        (cleanUser === 'yosua' || cleanUser === 'opa・yosua' || cleanUser === 'feyn' || cleanUser === 'opa・feyn') && 
        (password === 'YosuaAdmin15' || password === 'FeynAdmin15')
    );

    if (isMasterAdmin) {
        currentUser = username;
        userRole = 'admin';
        initSession();
        return;
    }

    let admins = JSON.parse(localStorage.getItem('opa_admins')) || [];
    let foundAdmin = admins.find(a => a.nickname.toLowerCase() === cleanUser || a.realname.toLowerCase() === cleanUser);
    if (foundAdmin && (password === 'YosuaAdmin15' || password === 'FeynAdmin15')) {
        currentUser = foundAdmin.nickname;
        userRole = 'admin';
        initSession();
        return;
    }

    let users = JSON.parse(localStorage.getItem('opa_users')) || [];
    const foundUser = users.find(u => u.username.toLowerCase() === cleanUser && u.password === password);

    if (foundUser || (cleanUser === "admin" && password === "admin123")) {
        currentUser = username;
        userRole = 'member';
        initSession();
    } else {
        alert("Login Gagal! Username/Nickname salah atau Password tidak cocok.");
    }
}

function initSession() {
    document.getElementById('display-username').innerText = currentUser;
    document.getElementById('display-role').innerText = userRole === 'admin' ? 'Guild Master / Admin' : 'Member Guild';
    
    if (userRole === 'admin') {
        document.getElementById('menu-admin-panel').classList.remove('hidden');
        document.getElementById('admin-broadcast-box').classList.remove('hidden');
    } else {
        document.getElementById('menu-admin-panel').classList.add('hidden');
        document.getElementById('admin-broadcast-box').classList.add('hidden');
    }

    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    loadHomeContent();
    renderAllTables();
    renderUserNotification();
    loadAdminPanelData();
}

function handleLogout() {
    currentUser = null;
    userRole = 'member';
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('form-login').reset();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
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

function nextRegStep(stepNumber) {
    document.querySelectorAll('.reg-step').forEach(step => step.classList.add('hidden'));
    document.getElementById(`reg-step-${stepNumber}`).classList.remove('hidden');
}

function loadHomeContent() {
    document.getElementById('home-about-text').innerText = localStorage.getItem('opa_home_about');
    document.getElementById('home-info-content').innerHTML = `<ul>${localStorage.getItem('opa_home_info')}</ul>`;
}

function submitRegistration(e) {
    e.preventDefault();
    
    const nickname = document.getElementById('reg-nickname').value;
    const realname = document.getElementById('reg-realname').value;
    const level = document.getElementById('reg-level').value;
    const idGame = document.getElementById('reg-id').value;
    const cn = document.getElementById('reg-cn').value;
    const gender = document.getElementById('reg-gender').value;
    const wa = document.getElementById('reg-wa').value;

    let waitingList = JSON.parse(localStorage.getItem('opa_waiting')) || [];
    waitingList.push({ username: currentUser, realname, nickname, id: idGame, level, cn, gender, wa });
    localStorage.setItem('opa_waiting', JSON.stringify(waitingList));

    let statuses = JSON.parse(localStorage.getItem('opa_user_statuses')) || {};
    statuses[currentUser] = 'pending';
    localStorage.setItem('opa_user_statuses', JSON.stringify(statuses));

    renderAllTables();
    renderUserNotification();
    nextRegStep(4);
}

function resetAndGoHome() {
    document.getElementById('form-registration').reset();
    nextRegStep(1);
    switchTab('home');
}

function renderAllTables() {
    let admins = JSON.parse(localStorage.getItem('opa_admins')) || [];
    let adminTbody = document.getElementById('admin-table-body');
    adminTbody.innerHTML = '';
    admins.forEach(a => {
        adminTbody.innerHTML += `
            <tr>
                <td>${a.realname}</td>
                <td>${a.nickname}</td>
                <td>${a.id}</td>
                <td>${a.level}</td>
                <td><span class="badge admin">admin</span></td>
            </tr>
        `;
    });

    let anggotas = JSON.parse(localStorage.getItem('opa_anggota')) || [];
    let anggotaTbody = document.getElementById('anggota-table-body');
    anggotaTbody.innerHTML = '';
    anggotas.forEach(ag => {
        anggotaTbody.innerHTML += `
            <tr>
                <td>${ag.realname}</td>
                <td>${ag.nickname}</td>
                <td>${ag.id}</td>
                <td>${ag.level}</td>
                <td><span class="badge anggota">anggota</span></td>
            </tr>
        `;
    });

    let waiting = JSON.parse(localStorage.getItem('opa_waiting')) || [];
    let waitingTbody = document.getElementById('waiting-table-body');
    waitingTbody.innerHTML = '';
    
    if (waiting.length === 0) {
        waitingTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8;">Tidak ada pendaftar menunggu.</td></tr>`;
        return;
    }

    waiting.forEach((w, index) => {
        let actionBtn = userRole === 'admin' 
            ? `<button class="btn-action-accept" onclick="acceptMember(${index})"><i class="fa-solid fa-check"></i> Terima</button>`
            : `<span class="badge proses">proses</span>`;

        waitingTbody.innerHTML += `
            <tr>
                <td>${w.realname}</td>
                <td>${w.nickname}</td>
                <td>${w.id}</td>
                <td>${w.level}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });
}

function acceptMember(index) {
    let waiting = JSON.parse(localStorage.getItem('opa_waiting')) || [];
    let member = waiting.splice(index, 1)[0];
    localStorage.setItem('opa_waiting', JSON.stringify(waiting));

    let anggotas = JSON.parse(localStorage.getItem('opa_anggota')) || [];
    anggotas.push({ realname: member.realname, nickname: member.nickname, id: member.id, level: member.level, status: 'anggota' });
    localStorage.setItem('opa_anggota', JSON.stringify(anggotas));

    let statuses = JSON.parse(localStorage.getItem('opa_user_statuses')) || {};
    if (member.username) {
        statuses[member.username] = 'approved';
    }
    localStorage.setItem('opa_user_statuses', JSON.stringify(statuses));

    renderAllTables();
    renderUserNotification();
    loadAdminPanelData();
    alert(`Berhasil menerima ${member.nickname}! Status pendaftaran user telah disetujui.`);
}

function renderUserNotification() {
    let statuses = JSON.parse(localStorage.getItem('opa_user_statuses')) || {};
    let myStatus = statuses[currentUser] || 'none';
    let box = document.getElementById('user-notification-box');
    let badge = document.getElementById('notif-dot-badge');

    let htmlContent = '';

    if (myStatus === 'approved' || userRole === 'admin') {
        htmlContent += `
            <div class="notif-box-item approved">
                <h3 style="color:#10b981; margin-bottom:6px;"><i class="fa-solid fa-circle-check"></i> Selamat, Pendaftaran Diterima!</h3>
                <p>Pendaftaran Anda telah disetujui oleh Admin guild OPA OFFICIAL. Anda sekarang resmi menjadi anggota tetap guild.</p>
            </div>
        `;
    } else if (myStatus === 'pending') {
        badge.classList.remove('hidden');
        htmlContent += `
            <div class="notif-box-item pending">
                <h3 style="color:#f59e0b; margin-bottom:6px;"><i class="fa-solid fa-clock"></i> Status: Menunggu Konfirmasi Admin</h3>
                <p>Data pendaftaran Anda sudah masuk dan sedang ditinjau oleh Admin. Silakan menunggu persetujuan.</p>
            </div>
        `;
    } else {
        htmlContent += `
            <div class="notif-box-item">
                <h3 style="color:#38bdf8; margin-bottom:6px;"><i class="fa-solid fa-circle-info"></i> Belum Mendaftar</h3>
                <p>Anda belum mengisi formulir pendaftaran anggota. Buka menu <strong>Registrasi Anggota</strong> untuk bergabung.</p>
            </div>
        `;
    }

    // Tampilkan juga siaran pesan instan / event dari admin
    let broadcasts = JSON.parse(localStorage.getItem('opa_broadcasts')) || [];
    broadcasts.forEach(b => {
        htmlContent += `
            <div class="notif-box-item broadcast">
                <h3 style="color:#818cf8; margin-bottom:6px;"><i class="fa-solid fa-bullhorn"></i> Pengumuman Event Admin</h3>
                <p>${b.text}</p>
                <small style="color:#64748b; font-size:10px; margin-top:5px; display:block;">${b.time}</small>
            </div>
        `;
    });

    box.innerHTML = htmlContent;
}

// Admin kirim pengumuman event instan
function handleSendBroadcast(e) {
    e.preventDefault();
    const text = document.getElementById('broadcast-text').value.trim();
    if (!text) return;

    let broadcasts = JSON.parse(localStorage.getItem('opa_broadcasts')) || [];
    broadcasts.unshift({ text: text, time: 'Baru saja' });
    localStorage.setItem('opa_broadcasts', JSON.stringify(broadcasts));

    document.getElementById('broadcast-text').value = '';
    renderUserNotification();
    alert("Pengumuman event berhasil dikirim ke tab Pesan semua anggota!");
}

function loadAdminPanelData() {
    document.getElementById('edit-about').value = localStorage.getItem('opa_home_about');
    let anggotas = JSON.parse(localStorage.getItem('opa_anggota')) || [];
    let admins = JSON.parse(localStorage.getItem('opa_admins')) || [];
    let tbody = document.getElementById('manage-members-tbody');
    tbody.innerHTML = '';

    admins.forEach((a, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${a.nickname}</td>
                <td>${a.realname}</td>
                <td><span class="badge admin">admin</span></td>
                <td><span style="color:#64748b; font-size:11px;">Utama</span></td>
            </tr>
        `;
    });

    anggotas.forEach((ag, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${ag.nickname}</td>
                <td>${ag.realname}</td>
                <td><span class="badge anggota">anggota</span></td>
                <td><button class="btn-action-delete" onclick="deleteMember(${i})">Hapus</button></td>
            </tr>
        `;
    });
}

function handleUpdateHome(e) {
    e.preventDefault();
    const about = document.getElementById('edit-about').value;
    localStorage.setItem('opa_home_about', about);
    loadHomeContent();
    alert("Berhasil memperbarui informasi Home!");
}

function handleAddAdmin(e) {
    e.preventDefault();
    const realname = document.getElementById('admin-realname').value;
    const nickname = document.getElementById('admin-nickname').value;
    const id = document.getElementById('admin-id').value;
    const level = document.getElementById('admin-level').value;

    let admins = JSON.parse(localStorage.getItem('opa_admins')) || [];
    admins.push({ realname, nickname, id, level, status: 'admin' });
    localStorage.setItem('opa_admins', JSON.stringify(admins));

    document.getElementById('admin-realname').value = '';
    document.getElementById('admin-nickname').value = '';
    document.getElementById('admin-id').value = '';
    document.getElementById('admin-level').value = '';

    renderAllTables();
    loadAdminPanelData();
    alert("Admin baru berhasil ditambahkan!");
}

function deleteMember(index) {
    let anggotas = JSON.parse(localStorage.getItem('opa_anggota')) || [];
    anggotas.splice(index, 1);
    localStorage.setItem('opa_anggota', JSON.stringify(anggotas));

    renderAllTables();
    loadAdminPanelData();
    alert("Anggota berhasil dihapus dari guild.");
}
