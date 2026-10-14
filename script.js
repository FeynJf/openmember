let currentUser = null;
let userRole = 'member'; // 'admin' atau 'member'

// Inisialisasi data default di localStorage jika belum ada
if (!localStorage.getItem('opa_admins')) {
    localStorage.setItem('opa_admins', JSON.stringify([
        { realname: 'Feyn Master', nickname: 'OPA・Feyn', id: '10001515', level: '99', status: 'admin' }
    ]));
}

if (!localStorage.getItem('opa_anggota')) {
    localStorage.setItem('opa_anggota', JSON.stringify([
        { realname: 'Dimas Pratama', nickname: 'OPA・Vortex', id: '11223344', level: '85', status: 'anggota' }
    ]));
}

if (!localStorage.getItem('opa_waiting')) {
    localStorage.setItem('opa_waiting', JSON.stringify([
        { realname: 'Budi Santoso', nickname: 'OPA・Budi', id: '99887766', level: '50', cn: 'Besok', gender: 'Laki-laki', wa: '08123456789' }
    ]));
}

if (!localStorage.getItem('opa_messages')) {
    localStorage.setItem('opa_messages', JSON.stringify([
        { sender: 'ADMIN Feyn', text: 'Selamat datang di OPA OFFICIAL! Cek pesan ini untuk pemberitahuan status penerimaan guild.' }
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

    // Cek Admin Khusus Feyn
    if ((username.toLowerCase() === 'feyn' || username === 'OPA・Feyn') && password === 'FeynAdmin15') {
        currentUser = 'OPA・Feyn';
        userRole = 'admin';
        initSession();
        return;
    }

    // Cek Admin Tambahan di database
    let admins = JSON.parse(localStorage.getItem('opa_admins')) || [];
    let foundAdmin = admins.find(a => a.nickname.toLowerCase() === username.toLowerCase() || a.realname.toLowerCase() === username.toLowerCase());
    if (foundAdmin && password === 'FeynAdmin15') {
        currentUser = foundAdmin.nickname;
        userRole = 'admin';
        initSession();
        return;
    }

    // Cek User Biasa Terdaftar
    let users = JSON.parse(localStorage.getItem('opa_users')) || [];
    const foundUser = users.find(u => u.username === username && u.password === password);

    if (foundUser || (username === "admin" && password === "admin123")) {
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
    
    // Tampilkan tombol tambah admin jika login sebagai admin utama Feyn
    if (userRole === 'admin') {
        document.getElementById('admin-add-box').style.display = 'block';
    } else {
        document.getElementById('admin-add-box').style.display = 'none';
    }

    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    
    renderAllTables();
    renderMessages();
}

function handleLogout() {
    currentUser = null;
    userRole = 'member';
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('form-login').reset();
}

// Toggle Sidebar Mobile
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
}

// Navigasi Menu Utama
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
            // Hilangkan titik notifikasi merah saat menu pesan dibuka
            document.getElementById('msg-badge').classList.add('hidden');
        }
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

// Kirim Registrasi
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
    waitingList.push({ realname, nickname, id: idGame, level, cn, gender, wa });
    localStorage.setItem('opa_waiting', JSON.stringify(waitingList));

    renderAllTables();
    nextRegStep(4);
}

function resetAndGoHome() {
    document.getElementById('form-registration').reset();
    nextRegStep(1);
    switchTab('home');
}

// Render Tabel Data
function renderAllTables() {
    // Admin Table
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

    // Anggota Table
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

    // Waiting Table
    let waiting = JSON.parse(localStorage.getItem('opa_waiting')) || [];
    let waitingTbody = document.getElementById('waiting-list-tbody');
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

// Admin Terima Anggota Baru & Kirim Notifikasi Pesan Otomatis
function acceptMember(index) {
    let waiting = JSON.parse(localStorage.getItem('opa_waiting')) || [];
    let member = waiting.splice(index, 1)[0];
    localStorage.setItem('opa_waiting', JSON.stringify(waiting));

    // Masukkan ke daftar anggota resmi
    let anggotas = JSON.parse(localStorage.getItem('opa_anggota')) || [];
    anggotas.push({ realname: member.realname, nickname: member.nickname, id: member.id, level: member.level, status: 'anggota' });
    localStorage.setItem('opa_anggota', JSON.stringify(anggotas));

    // Kirim pesan otomatis pemberitahuan ke menu Pesan
    let messages = JSON.parse(localStorage.getItem('opa_messages')) || [];
    messages.push({ 
        sender: 'SISTEM GUILD', 
        text: `🎉 Selamat ${member.nickname} (${member.realname}), pendaftaran Anda telah DISETUJUI oleh Admin! Anda resmi diterima sebagai Anggota Guild OPA.` 
    });
    localStorage.setItem('opa_messages', JSON.stringify(messages));

    // Tampilkan notifikasi titik merah di menu pesan
    document.getElementById('msg-badge').classList.remove('hidden');

    renderAllTables();
    renderMessages();
    alert(`Berhasil menerima ${member.nickname}! Notifikasi telah dikirim ke menu Pesan.`);
}

// Tambah Admin Baru Modal
function openAddAdminModal() {
    document.getElementById('adminModal').classList.remove('hidden');
}

function closeAddAdminModal() {
    document.getElementById('adminModal').classList.add('hidden');
}

function handleAddAdmin(e) {
    e.preventDefault();
    const realname = document.getElementById('new-admin-realname').value;
    const nickname = document.getElementById('new-admin-nickname').value;
    const id = document.getElementById('new-admin-id').value;
    const level = document.getElementById('new-admin-level').value;

    let admins = JSON.parse(localStorage.getItem('opa_admins')) || [];
    admins.push({ realname, nickname, id, level, status: 'admin' });
    localStorage.setItem('opa_admins', JSON.stringify(admins));

    closeAddAdminModal();
    document.getElementById('new-admin-realname').value = '';
    document.getElementById('new-admin-nickname').value = '';
    document.getElementById('new-admin-id').value = '';
    document.getElementById('new-admin-level').value = '';

    renderAllTables();
    alert("Admin baru berhasil ditambahkan!");
}

// Fitur Pesan / Chat Guild
function renderMessages() {
    let messages = JSON.parse(localStorage.getItem('opa_messages')) || [];
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = '';
    
    messages.forEach(m => {
        chatMessages.innerHTML += `
            <div class="chat-msg">
                <strong>[${m.sender}]:</strong> ${m.text}
            </div>
        `;
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    let messages = JSON.parse(localStorage.getItem('opa_messages')) || [];
    messages.push({ sender: currentUser || 'Member', text: text });
    localStorage.setItem('opa_messages', JSON.stringify(messages));

    input.value = '';
    renderMessages();
}

function handleChatPress(e) {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
}
