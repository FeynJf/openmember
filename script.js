let currentUser = null;

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

    let users = JSON.parse(localStorage.getItem('opa_users')) || [];

    if (users.length === 0) {
        users.push({ username: "zera", password: "password123" });
    }

    const foundUser = users.find(u => u.username === username && u.password === password);

    if (foundUser || (username === "admin" && password === "admin123")) {
        currentUser = username;
        document.getElementById('display-username').innerText = username;
        
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
    } else {
        alert("Login Gagal! Username salah atau Password acak tidak cocok.");
    }
}

function handleLogout() {
    currentUser = null;
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
}

// Toggle Sidebar Mobile dengan Overlay yang Mulus
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
        // Cari elemen menu berdasarkan tabId jika dipanggil manual
        const menus = document.querySelectorAll('.sidebar-menu li');
        if (tabId === 'home') menus[0]?.classList.add('active');
        if (tabId === 'anggota') menus[1]?.classList.add('active');
        if (tabId === 'registrasi') menus[2]?.classList.add('active');
        if (tabId === 'pesan') menus[3]?.classList.add('active');
    }

    // Tutup sidebar otomatis di HP setelah menu diklik
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

function submitRegistration(e) {
    e.preventDefault();
    
    const nickname = document.getElementById('reg-nickname').value;
    const realname = document.getElementById('reg-realname').value;
    const level = document.getElementById('reg-level').value;
    const idGame = document.getElementById('reg-id').value;

    const tbody = document.getElementById('waiting-list-tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${realname}</td>
        <td>${nickname}</td>
        <td>${idGame}</td>
        <td>${level}</td>
        <td><span class="badge proses">proses</span></td>
    `;
    tbody.appendChild(newRow);

    nextRegStep(4);
}

function resetAndGoHome() {
    document.getElementById('form-registration').reset();
    nextRegStep(1);
    switchTab('home');
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    const chatMessages = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chat-msg');
    msgDiv.innerHTML = `<strong>[${currentUser || 'Member'}]:</strong> ${text}`;
    
    chatMessages.appendChild(msgDiv);
    input.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleChatPress(e) {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
}
