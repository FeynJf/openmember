// ============================================================
//  OPA OFFICIAL V40 — SCRIPT UTAMA
// ============================================================

let _rawUser = localStorage.getItem('opa_current_user');
let currentUser = (_rawUser && _rawUser !== 'null' && _rawUser !== 'undefined') ? _rawUser : null;
let userRole = localStorage.getItem('opa_current_role') || 'member';
let activeChatMode = 'group';
let currentPrivateTarget = null;
let currentAnggotaFilter = 'diterima';
let emojiTarget = 'group';

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
        if (splash) { splash.classList.add('fade-out'); setTimeout(() => { if (splash) splash.style.display = 'none'; }, 500); }
        initAppSession();
        return;
    }
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


// ===== IndexedDB media storage (video/gambar ukuran bebas) =====
const OPA_MEDIA_DB = 'opa_media_db';
const OPA_MEDIA_STORE = 'media';

function openMediaDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(OPA_MEDIA_DB, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(OPA_MEDIA_STORE)) {
                db.createObjectStore(OPA_MEDIA_STORE, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function saveMediaBlob(file) {
    const id = 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    const buf = await file.arrayBuffer();
    const db = await openMediaDB();
    await new Promise((resolve, reject) => {
        const tx = db.transaction(OPA_MEDIA_STORE, 'readwrite');
        tx.objectStore(OPA_MEDIA_STORE).put({
            id,
            type: file.type || 'application/octet-stream',
            name: file.name || 'file',
            blob: new Blob([buf], { type: file.type || 'application/octet-stream' })
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    db.close();
    return id;
}

async function getMediaObjectURL(mediaId) {
    if (!mediaId) return null;
    if (mediaId.startsWith('data:')) return mediaId; // legacy base64
    const db = await openMediaDB();
    const row = await new Promise((resolve, reject) => {
        const tx = db.transaction(OPA_MEDIA_STORE, 'readonly');
        const req = tx.objectStore(OPA_MEDIA_STORE).get(mediaId);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    db.close();
    if (!row || !row.blob) return null;
    return URL.createObjectURL(row.blob);
}

function safeLoadMessages(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback || [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : (fallback || []);
    } catch (e) {
        console.warn('load messages failed', key, e);
        return fallback || [];
    }
}

function safeSaveMessages(key, msgs) {
    try {
        // simpan tanpa mediaUrl base64 besar (hanya mediaId)
        const slim = msgs.map(m => {
            const copy = { ...m };
            if (copy.mediaUrl && String(copy.mediaUrl).startsWith('data:') && copy.mediaId) {
                delete copy.mediaUrl; // legacy cleanup
            }
            // jangan simpan blob URL sementara
            if (copy.mediaUrl && String(copy.mediaUrl).startsWith('blob:')) delete copy.mediaUrl;
            return copy;
        });
        localStorage.setItem(key, JSON.stringify(slim));
        return true;
    } catch (e) {
        console.warn('save messages failed', e);
        alert('Gagal menyimpan chat (penyimpanan penuh). Hapus beberapa media lama.');
        return false;
    }
}

function initAppSession() {
    if (currentUser) {
        document.getElementById('login-page')?.classList.add('hidden');
        document.getElementById('main-app')?.classList.remove('hidden');
        const splash = document.getElementById('splash-screen');
        if (splash) { splash.classList.add('fade-out'); splash.style.display = 'none'; }
        renderUserInfo();
        initTabsAccess();
        document.querySelectorAll('.content-section').forEach(s => { s.classList.remove('active'); s.classList.add('hidden'); });
        const home = document.getElementById('view-home');
        if (home) { home.classList.remove('hidden'); home.classList.add('active'); }
        document.querySelectorAll('.sidebar-menu .menu-item').forEach(m => m.classList.remove('active'));
        document.querySelector('.sidebar-menu .menu-item')?.classList.add('active');
        renderAnggotaList();
        renderCustomRegFieldsTable();
        renderAdminMembersTable();
        renderPrivateConversations();
        renderGroupMessages();
        renderCSMessages();
    } else {
        document.getElementById('main-app')?.classList.add('hidden');
    }
}

function renderUserInfo() {
    const name = currentUser || 'Guest';
    const profiles = JSON.parse(localStorage.getItem('opa_profiles') || '{}');
    const photo = (profiles[name] || {}).photo;

    const el = document.getElementById('header-username');
    if (el) el.textContent = name;
    const av = document.getElementById('header-avatar');
    if (av) {
        if (photo) {
            if (av.tagName === 'IMG') { av.src = photo; }
            else { av.style.backgroundImage = 'url(' + photo + ')'; av.style.backgroundSize = 'cover'; av.textContent = ''; }
        } else {
            if (av.tagName === 'IMG') { av.src = 'logo.png'; }
            else { av.style.backgroundImage = ''; av.textContent = (name.charAt(0) || 'G').toUpperCase(); }
        }
    }
    const pu = document.getElementById('profile-username-display');
    if (pu) pu.textContent = name;
    const pr = document.getElementById('profile-role-display');
    if (pr) pr.textContent = userRole || 'member';
}

function initTabsAccess() {
    const isAdmin = userRole === 'admin' || userRole === 'leader';
    ['menu-custom-reg','menu-admin-panel'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (isAdmin) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });
}

function switchLoginMode(mode) {
    const loginBtn = document.getElementById('tab-btn-login');
    const regBtn = document.getElementById('tab-btn-register');
    const submitBtn = document.getElementById('auth-submit-btn');
    if (mode === 'login') {
        loginBtn?.classList.add('active'); regBtn?.classList.remove('active');
        if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> MASUK';
    } else {
        regBtn?.classList.add('active'); loginBtn?.classList.remove('active');
        if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> DAFTAR';
    }
}

function handleAuthSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('login-username')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    if (!username || !password) return alert('Isi username dan password!');
    const isRegister = document.getElementById('tab-btn-register')?.classList.contains('active');
    let users = JSON.parse(localStorage.getItem('opa_users') || '{}');
    const adminAccounts = {
        'feyn':  { passwords: ['FeynJFAdmin15'], role: 'admin', display: 'OPA • Feyn' },
        'maboo': { passwords: ['MaboAdmin16'], role: 'leader', display: 'OPA • Maboo' },
        'pongo': { passwords: ['PongoAdmin17'], role: 'admin', display: 'OPA • Pongo' }
    }
    const lower = username.toLowerCase().replace(/^opa\s*[•・]\s*/i, '').trim();
    if (isRegister) {
        if (adminAccounts[lower]) return alert('Username ini khusus admin, tidak bisa daftar.');
        if (users[lower]) return alert('Username sudah terdaftar!');
        users[lower] = { password, role: 'member' };
        localStorage.setItem('opa_users', JSON.stringify(users));
        alert('Akun berhasil didaftarkan! Silakan login.');
        switchLoginMode('login');
        return;
    }
    if (adminAccounts[lower] && adminAccounts[lower].passwords.includes(password)) {
        currentUser = username;
        userRole = adminAccounts[lower].role;
        users[lower] = { password, role: userRole };
        localStorage.setItem('opa_users', JSON.stringify(users));
    } else if (users[lower] && users[lower].password === password) {
        currentUser = username;
        userRole = users[lower].role || 'member';
    } else if (password === username || password === '123456') {
        currentUser = username;
        userRole = adminAccounts[lower] ? adminAccounts[lower].role : 'member';
        if (!users[lower]) {
            users[lower] = { password, role: userRole };
            localStorage.setItem('opa_users', JSON.stringify(users));
        }
    } else {
        return alert('Username atau password salah!');
    }
    localStorage.setItem('opa_current_user', currentUser);
    localStorage.setItem('opa_current_role', userRole);
    initAppSession();
}

function handleLogout() {
    logout();
}
function logout() {
    localStorage.removeItem('opa_current_user');
    localStorage.removeItem('opa_current_role');
    currentUser = null;
    location.reload();
}

function switchTab(tabId, el) {
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
        sec.classList.add('hidden');
    });
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(m => m.classList.remove('active'));
    const target = document.getElementById('view-' + tabId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
    if (el) el.classList.add('active');
    document.getElementById('sidebar')?.classList.remove('open');
    if (tabId === 'anggota') renderAnggotaList();
    if (tabId === 'chat') { switchChatMode(typeof activeChatMode !== 'undefined' && activeChatMode ? activeChatMode : 'group'); }
    if (tabId === 'admin') renderAdminMembersTable();
    if (tabId === 'customreg') renderCustomRegFieldsTable();
    if (tabId === 'csbot') renderCSMessages();
    if (tabId === 'customui') setTimeout(() => { updateUIPreview(); loadChatUIControls(); }, 50);
    // auto clear CS chat when leaving
    if (window._lastTab === 'csbot' && tabId !== 'csbot') {
        localStorage.removeItem('opa_cs_chat');
    }
    window._lastTab = tabId;
}

function toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('show');
}

function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
}

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
        list = list.filter(m => (m.nama||'').toLowerCase().includes(term) || (m.id||'').includes(term) || (m.jabatan||'').toLowerCase().includes(term));
    }
    const container = document.getElementById('memberHotbarList');
    if (!container) return;
    if (!list.length) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">Belum ada data anggota.</div>';
        return;
    }
    const onlineUser = currentUser ? currentUser.toLowerCase() : '';
    container.innerHTML = list.map(m => {
        const isOnline = onlineUser && ((m.nama||'').toLowerCase()===onlineUser || (m.realname||'').toLowerCase()===onlineUser);
        const onlineLabel = isOnline ? 'Online' : 'Offline';
        const onlineColor = isOnline ? 'var(--success)' : '#94a3b8';
        const statusAnggota = m.status === 'diterima' ? 'Diterima' : 'Menunggu';
        const statusColor = m.status === 'diterima' ? 'var(--success)' : '#f97316';
        return `<div class="roster-card-bar animate-fade-in">
            <div class="roster-field"><label>Nickname</label><span>${escapeHtml(m.nama||'-')}</span></div>
            <div class="roster-field"><label>Name</label><span>${escapeHtml(m.realname||m.nama||'-')}</span></div>
            <div class="roster-field"><label>ID Akun</label><span>${escapeHtml(m.id||'-')}</span></div>
            <div class="roster-field"><label>Gender</label><span>${escapeHtml(m.gender||'-')}</span></div>
            <div class="roster-field"><label>Jabatan</label><span>${escapeHtml(m.jabatan||'Anggota')}</span></div>
            <div class="roster-field"><label>Status</label><span style="color:${onlineColor}">${onlineLabel}</span></div>
            <div class="roster-field"><label>Status Anggota</label><span style="color:${statusColor}">${statusAnggota}</span></div>
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

function initRegistrationLogic() {
    const agreeCheck = document.getElementById('agreeCheck');
    const toStep2 = document.getElementById('toStep2');
    if (agreeCheck && toStep2) agreeCheck.addEventListener('change', (e) => { toStep2.disabled = !e.target.checked; });
}

document.getElementById('toStep2')?.addEventListener('click', () => goStep(2));
document.getElementById('toStep3')?.addEventListener('click', () => goStep(3));
document.querySelectorAll('[data-back-step]').forEach(btn => btn.addEventListener('click', () => goStep(parseInt(btn.dataset.backStep))));


function handleRegistrationSubmit(e) {
    e.preventDefault();
    const nama = document.getElementById('reg-nama')?.value.trim() || '';
    const idGame = document.getElementById('reg-idgame')?.value.trim() || '';
    const namaLengkap = document.getElementById('reg-namalengkap')?.value.trim() || nama;
    const level = document.getElementById('reg-level')?.value || '';
    const usia = document.getElementById('reg-usia')?.value || '';
    const hp = document.getElementById('reg-hp')?.value || '';
    const email = document.getElementById('reg-email')?.value || '';
    const waktuCN = document.getElementById('reg-waktucn')?.value || '';
    const genderEl = document.querySelector('input[name="reg-gender"]:checked');
    const gender = genderEl ? genderEl.value : 'Laki-laki';
    const discordEl = document.querySelector('input[name="reg-discord"]:checked');
    const hasDiscord = discordEl ? discordEl.value : 'tidak';
    const discordUser = document.getElementById('reg-discord-user')?.value.trim() || '';

    if (!nama || !idGame) return alert('Isi data wajib!');
    if (!genderEl) return alert('Pilih gender!');
    if (!usia || Number(usia) < 18) return alert('Usia minimum 18 tahun!');
    if (!level || Number(level) < 40) return alert('Level minimum 40!');
    if (!waktuCN) return alert('Pilih waktu CN!');
    if (!hp) return alert('Isi nomor HP/WA!');
    if (!email) return alert('Isi email!');
    if (!discordEl) return alert('Pilih status Discord!');
    if (hasDiscord === 'ya' && !discordUser) return alert('Isi username Discord!');

    const prefix = gender === 'Perempuan' ? 'OMA • ' : 'OPA • ';
    const nickFormat = prefix + nama;

    let customMembers = JSON.parse(localStorage.getItem('opa_custom_members')) || [];
    customMembers.push({
        nama: nickFormat,
        realname: namaLengkap,
        id: idGame,
        jabatan: 'Anggota',
        status: 'menunggu',
        gender: gender,
        online: 'offline',
        level, usia, hp, email, waktuCN,
        hasDiscord, discordUser,
        tanggal: new Date().toLocaleDateString('id-ID')
    });
    localStorage.setItem('opa_custom_members', JSON.stringify(customMembers));

    // Summary
    const summary = document.getElementById('reg-summary');
    if (summary) {
        const rows = [
            ['Nama lengkap', namaLengkap], ['Nama in-game', nama], ['ID Free Fire', idGame],
            ['Gender', gender], ['Level akun', level], ['Waktu CN', waktuCN],
            ['Usia', usia], ['No. HP/WA', hp], ['Email', email],
            ['Discord', hasDiscord === 'ya' ? discordUser : 'Tidak punya']
        ];
        summary.innerHTML = rows.map(([k,v]) => `<div class="summary-row"><span>${k}</span><strong>${escapeHtml(String(v))}</strong></div>`).join('');
    }
    const cnEl = document.getElementById('cnValue');
    if (cnEl) cnEl.textContent = nickFormat;

    goStep('done');
    document.getElementById('regForm')?.reset();
    const agree = document.getElementById('agreeCheck');
    if (agree) agree.checked = false;
    const toStep2 = document.getElementById('toStep2');
    if (toStep2) toStep2.disabled = true;
    renderAnggotaList();
    renderAdminMembersTable();
}

function copyCNFormat() {
    const t = document.getElementById('cnValue')?.textContent || '';
    if (!t) return;
    navigator.clipboard?.writeText(t).then(() => alert('Format disalin: ' + t)).catch(() => alert(t));
}

function goStep(stepNum) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const sel = stepNum === 'done' ? '.step[data-step="done"]' : `.step[data-step="${stepNum}"]`;
    document.querySelector(sel)?.classList.add('active');
    document.querySelectorAll('.track__pt').forEach((pt, idx) => {
        if (stepNum === 'done') pt.classList.add('active');
        else pt.classList.toggle('active', idx + 1 === Number(stepNum));
    });
}


function switchChatMode(mode) {
    activeChatMode = mode;
    const btnGrp = document.getElementById('btn-toggle-group');
    const btnPrv = document.getElementById('btn-toggle-private');
    const boxGrp = document.getElementById('chat-mode-group');
    const boxPrv = document.getElementById('chat-mode-private');
    btnGrp?.classList.toggle('active', mode === 'group');
    btnPrv?.classList.toggle('active', mode === 'private');
    if (boxGrp) {
        if (mode === 'group') {
            boxGrp.classList.remove('hidden');
            boxGrp.style.display = 'flex';
        } else {
            boxGrp.classList.add('hidden');
            boxGrp.style.display = 'none';
        }
    }
    if (boxPrv) {
        if (mode === 'private') {
            boxPrv.classList.remove('hidden');
            boxPrv.style.display = 'flex';
        } else {
            boxPrv.classList.add('hidden');
            boxPrv.style.display = 'none';
        }
    }
    const fab = document.getElementById('floatingPlusBtn');
    if (fab) fab.style.display = mode === 'private' ? '' : 'none';
    if (mode === 'group') renderGroupMessages();
    else { backToPrivateList(); renderPrivateConversations(); }
}

function getInitials(name) {
    if (!name) return '?';
    const parts = String(name).replace(/OPA\s*[•・]\s*/i, '').trim().split(/\s+/);
    return (parts[0] || '?').charAt(0).toUpperCase();
}

function getAvatarHTML(sender) {
    const profiles = JSON.parse(localStorage.getItem('opa_profiles') || '{}');
    let photo = null;
    if (profiles[sender] && profiles[sender].photo) photo = profiles[sender].photo;
    else {
        const key = Object.keys(profiles).find(k => k.toLowerCase() === String(sender || '').toLowerCase());
        if (key && profiles[key].photo) photo = profiles[key].photo;
        if (!photo && currentUser && (sender === currentUser || String(sender || '').toLowerCase() === String(currentUser).toLowerCase())) {
            if (profiles[currentUser] && profiles[currentUser].photo) photo = profiles[currentUser].photo;
        }
    }
    if (photo) {
        return '<div class="chat-avatar has-photo" style="background-image:url(' + photo + ');background-size:cover;background-position:center;"></div>';
    }
    return '<div class="chat-avatar">' + getInitials(sender) + '</div>';
}

function buildChatHTML(m, isMe) {
    const statusIcon = isMe ? '<span class="chat-status"><i class="fa-solid fa-check-double"></i></span>' : '';
    const mid = m.mediaId || '';
    const mtype = m.mediaType || '';
    let body = '';
    if ((mtype === 'image' || mtype === 'video') && (mid || m.mediaUrl)) {
        const placeholder = mtype === 'video'
            ? `<div class="chat-media chat-media-loading" data-media-id="${mid}" data-media-type="video" data-media-url="${m.mediaUrl && String(m.mediaUrl).startsWith('data:') ? '' : ''}"><div class="chat-media-placeholder">Memuat video...</div></div>`
            : `<div class="chat-media chat-media-loading" data-media-id="${mid}" data-media-type="image"><div class="chat-media-placeholder">Memuat gambar...</div></div>`;
        // legacy data url fallback
        if (m.mediaUrl && String(m.mediaUrl).startsWith('data:')) {
            if (mtype === 'image') {
                body = `<div class="chat-media"><img src="${m.mediaUrl}" alt="gambar" class="chat-media-img" onclick="openMediaPreview(this.src)"></div>`;
            } else {
                body = `<div class="chat-media"><video src="${m.mediaUrl}" class="chat-media-video" controls playsinline></video></div>`;
            }
        } else {
            body = placeholder;
        }
        if (m.text && !String(m.text).startsWith('[Lampiran')) body += `<div class="chat-text">${escapeHtml(m.text)}${statusIcon}</div>`;
        else if (statusIcon) body += `<div class="chat-text">${statusIcon}</div>`;
    } else {
        body = `<div class="chat-text">${escapeHtml(m.text || '')}${statusIcon}</div>`;
    }
    return `<div class="chat-msg-row ${isMe ? 'outgoing' : 'incoming'}">
        ${getAvatarHTML(m.sender)}
        <div class="chat-bubble">
            <div class="chat-meta">
                <span class="chat-nick">${escapeHtml(m.sender || '')}</span>
                <span class="chat-time">${escapeHtml(m.time || '')}</span>
            </div>
            ${body}
        </div>
    </div>`;
}

async function hydrateChatMedia(container) {
    if (!container) return;
    const nodes = container.querySelectorAll('.chat-media-loading[data-media-id]');
    for (const node of nodes) {
        const id = node.getAttribute('data-media-id');
        const type = node.getAttribute('data-media-type');
        if (!id) continue;
        try {
            const url = await getMediaObjectURL(id);
            if (!url) {
                node.innerHTML = '<div class="chat-media-placeholder">Media tidak ditemukan</div>';
                continue;
            }
            if (type === 'video') {
                node.innerHTML = `<video src="${url}" class="chat-media-video" controls playsinline></video>`;
            } else {
                node.innerHTML = `<img src="${url}" alt="gambar" class="chat-media-img" onclick="openMediaPreview(this.src)">`;
            }
            node.classList.remove('chat-media-loading');
        } catch (e) {
            node.innerHTML = '<div class="chat-media-placeholder">Gagal muat media</div>';
        }
    }
}

function openMediaPreview(src) {
    const w = window.open('');
    if (w) w.document.write('<img src="'+src+'" style="max-width:100%;height:auto;display:block;margin:auto;">');
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        if (!file) return reject(new Error('no file'));
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function detectMediaType(file) {
    if (!file) return 'file';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'file';
}

async function handleGroupFileUpload(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
        const mediaType = detectMediaType(file);
        if (mediaType === 'file') {
            alert('Format tidak didukung. Kirim gambar atau video.');
            return;
        }
        const mediaId = await saveMediaBlob(file);
        let msgs = safeLoadMessages('opa_group_chats', []);
        msgs.push({
            sender: currentUser,
            text: '',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mediaType,
            mediaId,
            fileName: file.name
        });
        safeSaveMessages('opa_group_chats', msgs);
        renderGroupMessages();
    } catch (err) {
        console.warn(err);
        alert('Gagal mengirim media: ' + (err && err.message ? err.message : err));
    }
}

async function handlePrivateFileUpload(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file || !currentPrivateTarget) return;
    try {
        const mediaType = detectMediaType(file);
        if (mediaType === 'file') {
            alert('Format tidak didukung. Kirim gambar atau video.');
            return;
        }
        const mediaId = await saveMediaBlob(file);
        const key = 'priv_' + [currentUser, currentPrivateTarget].sort().join('_');
        let msgs = safeLoadMessages(key, []);
        msgs.push({
            sender: currentUser,
            text: '',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            mediaType,
            mediaId,
            fileName: file.name
        });
        safeSaveMessages(key, msgs);
        renderPrivateMessages();
    } catch (err) {
        console.warn(err);
        alert('Gagal mengirim media: ' + (err && err.message ? err.message : err));
    }
}

function renderGroupMessages() {
    const box = document.getElementById('group-messages-box');
    if (!box) return;
    let msgs = safeLoadMessages('opa_group_chats', [{ sender: 'OPA • Maboo', text: 'Selamat datang di obrolan resmi OPA OFFICIAL!', time: '10:00' }]);
    box.innerHTML = msgs.map(m => buildChatHTML(m, m.sender === currentUser)).join('');
    box.scrollTop = box.scrollHeight;
    hydrateChatMedia(box);
}

function sendGroupMessage() {
    const input = document.getElementById('group-msg-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    const typingEl = document.getElementById('group-typing');
    if (typingEl) typingEl.innerHTML = 'Mengetik<span class="typing-dots"><span></span><span></span><span></span></span>';
    input.value = '';
    setTimeout(() => {
        let msgs = safeLoadMessages('opa_group_chats', []);
        msgs.push({ sender: currentUser, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        safeSaveMessages('opa_group_chats', msgs);
        if (typingEl) typingEl.innerHTML = 'Online';
        renderGroupMessages();
    }, 400);
}
function handleGroupKey(e) { if (e.key === 'Enter') sendGroupMessage(); }

function insertEmoji(target, _emoji) { emojiTarget = target; openEmojiModal(); }
function openEmojiModal() {
    const modal = document.getElementById('emoji-modal');
    const grid = document.getElementById('emoji-grid');
    if (!modal || !grid) return;
    const emojis = ['😀','😁','😂','🤣','😊','😍','🥰','😘','😜','😎','🤩','😇','🤗','🤔','😅','😭','😡','👍','👎','👏','🙏','🔥','⭐','💯','❤️','💔','🎮','🏆','⚔️','🛡️','👑','💎','🚀','⚡','🎉','💪','🤝','👋','✅','❌','📌','💬','📢','🕐'];
    grid.innerHTML = emojis.map(em => `<button type="button" class="emoji-btn" onclick="pickEmoji('${em}')">${em}</button>`).join('');
    modal.classList.remove('hidden');
}
function closeEmojiModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.closest('.modal-close-btn')) return;
    document.getElementById('emoji-modal')?.classList.add('hidden');
}
function pickEmoji(em) {
    const id = emojiTarget === 'group' ? 'group-msg-input' : 'private-msg-input';
    const input = document.getElementById(id);
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

function renderPrivateConversations() {
    const list = document.getElementById('private-conversations-list');
    if (!list) return;
    let members = typeof MEMBERS !== 'undefined' ? MEMBERS : [];
    let custom = JSON.parse(localStorage.getItem('opa_custom_members')) || [];
    const all = [...members, ...custom].filter(m => m.status === 'diterima');
    if (!all.length) { list.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Belum ada anggota.</p>'; return; }
    list.innerHTML = all.map(m => `<div class="conv-item" onclick="openPrivateChat('${escapeHtml(m.nama)}')">
        <div class="chat-avatar">${getInitials(m.nama)}</div>
        <div class="conv-info"><strong>${escapeHtml(m.nama)}</strong><span>${escapeHtml(m.jabatan||'Anggota')}</span></div>
    </div>`).join('');
}
function openPrivateChat(name) {
    currentPrivateTarget = name;
    // pastikan mode private aktif, group tersembunyi
    const boxGrp = document.getElementById('chat-mode-group');
    const boxPrv = document.getElementById('chat-mode-private');
    if (boxGrp) { boxGrp.classList.add('hidden'); boxGrp.style.display = 'none'; }
    if (boxPrv) { boxPrv.classList.remove('hidden'); boxPrv.style.display = 'flex'; }
    document.getElementById('btn-toggle-group')?.classList.remove('active');
    document.getElementById('btn-toggle-private')?.classList.add('active');
    activeChatMode = 'private';
    const inbox = document.getElementById('private-inbox-view');
    const room = document.getElementById('private-chatroom-view');
    if (inbox) {
        inbox.classList.add('hidden');
        inbox.style.display = 'none';
    }
    if (room) {
        room.classList.remove('hidden');
        room.classList.add('private-room');
        room.style.display = 'flex';
        room.style.flexDirection = 'column';
        room.style.flex = '1';
        room.style.minHeight = '0';
        room.style.height = '100%';
        room.style.overflow = 'hidden';
    }
    const title = document.getElementById('private-chat-title');
    if (title) title.textContent = 'Chat dengan ' + name;
    renderPrivateMessages();
    // scroll to bottom after paint
    setTimeout(() => {
        const box = document.getElementById('private-messages-box');
        if (box) box.scrollTop = box.scrollHeight;
    }, 50);
}

function backToPrivateList() {
    currentPrivateTarget = null;
    const inbox = document.getElementById('private-inbox-view');
    const room = document.getElementById('private-chatroom-view');
    if (room) {
        room.classList.add('hidden');
        room.style.display = 'none';
    }
    if (inbox) {
        inbox.classList.remove('hidden');
        inbox.style.display = '';
    }
    renderPrivateConversations();
}


function renderPrivateMessages() {
    if (!currentPrivateTarget) return;
    const box = document.getElementById('private-messages-box');
    if (!box) return;
    const key = 'priv_' + [currentUser, currentPrivateTarget].sort().join('_');
    const msgs = JSON.parse(localStorage.getItem(key)) || [];
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
    setTimeout(() => {
        const key = 'priv_' + [currentUser, currentPrivateTarget].sort().join('_');
        let msgs = safeLoadMessages(key, []);
        msgs.push({ sender: currentUser, text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
        safeSaveMessages(key, msgs);
        renderPrivateMessages();
    }, 350);
}
function handlePrivateKey(e) { if (e.key === 'Enter') sendPrivateMessage(); }
/* old private file upload removed */

function openNewChatModal() {
    const modal = document.getElementById('new-chat-modal');
    const list = document.getElementById('new-chat-members-list');
    if (!modal || !list) return;
    let members = typeof MEMBERS !== 'undefined' ? MEMBERS : [];
    let custom = JSON.parse(localStorage.getItem('opa_custom_members')) || [];
    const all = [...members, ...custom].filter(m => m.status === 'diterima');
    list.innerHTML = all.map(m => `<div class="conv-item" onclick="openPrivateChat('${escapeHtml(m.nama)}');closeNewChatModal();switchChatMode('private');">
        <div class="chat-avatar">${getInitials(m.nama)}</div><strong>${escapeHtml(m.nama)}</strong>
    </div>`).join('');
    modal.classList.remove('hidden');
}
function closeNewChatModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.closest('.modal-close-btn')) return;
    document.getElementById('new-chat-modal')?.classList.add('hidden');
}


function renderCustomRegFieldsTable() {
    const tbody = document.getElementById('custom-reg-tbody');
    if (!tbody) return;
    let fields = JSON.parse(localStorage.getItem('opa_custom_reg_fields')) || [{ label: 'Divisi Game (ML/FF)', type: 'text' }];
    tbody.innerHTML = fields.map((f, idx) => `<tr><td>${idx+1}</td><td>${escapeHtml(f.label)}</td><td>${escapeHtml(f.type)}</td>
        <td><button class="btn-outline btn-sm" onclick="deleteCustomRegField(${idx})">Hapus</button></td></tr>`).join('');
}
function addCustomRegField() {
    const label = document.getElementById('custom-reg-label')?.value.trim();
    const type = document.getElementById('custom-reg-type')?.value || 'text';
    if (!label) return alert('Isi label field!');
    let fields = JSON.parse(localStorage.getItem('opa_custom_reg_fields')) || [];
    fields.push({ label, type });
    localStorage.setItem('opa_custom_reg_fields', JSON.stringify(fields));
    document.getElementById('custom-reg-label').value = '';
    renderCustomRegFieldsTable();
}
function deleteCustomRegField(idx) {
    let fields = JSON.parse(localStorage.getItem('opa_custom_reg_fields')) || [];
    fields.splice(idx, 1);
    localStorage.setItem('opa_custom_reg_fields', JSON.stringify(fields));
    renderCustomRegFieldsTable();
}

function getAllMembersList() {
    const overrides = JSON.parse(localStorage.getItem('opa_member_overrides') || '{}');

    let members = typeof MEMBERS !== 'undefined' ? MEMBERS.map((m,i)=>{
        const o = overrides[m.id] || overrides[m.nama] || {};
        return {...m, ...o, _src:'base', _idx:i};
    }) : [];
    let customMembers = (JSON.parse(localStorage.getItem('opa_custom_members'))||[]).map((m,i)=>({...m,_src:'custom',_idx:i}));
    return [...members, ...customMembers].filter(m => !m.hidden);
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
            <td>${escapeHtml(m.nama)}</td><td>${escapeHtml(m.id||'-')}</td><td>${escapeHtml(m.gender||'-')}</td>
            <td><select onchange="adminChangeRole(${idx}, this.value)" style="font-size:12px;padding:4px 6px;border-radius:6px;border:1px solid var(--border);">
                ${['Leader','Admin','Officer','Anggota'].map(r=>`<option value="${r}" ${m.jabatan===r?'selected':''}>${r}</option>`).join('')}
            </select></td>
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
        if (custom[m._idx]) {
            custom[m._idx].status = 'diterima';
            localStorage.setItem('opa_custom_members', JSON.stringify(custom));
        }
    } else {
        let overrides = JSON.parse(localStorage.getItem('opa_member_overrides') || '{}');
        const key = m.id || m.nama;
        overrides[key] = overrides[key] || {};
        overrides[key].status = 'diterima';
        localStorage.setItem('opa_member_overrides', JSON.stringify(overrides));
    }
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
        if (custom[m._idx]) {
            custom[m._idx].jabatan = role;
            localStorage.setItem('opa_custom_members', JSON.stringify(custom));
        }
    } else {
        let overrides = JSON.parse(localStorage.getItem('opa_member_overrides') || '{}');
        const key = m.id || m.nama;
        overrides[key] = overrides[key] || {};
        overrides[key].jabatan = role;
        localStorage.setItem('opa_member_overrides', JSON.stringify(overrides));
    }
    renderAdminMembersTable();
    renderAnggotaList();
}


function adminDeleteMember(idx) {
    if (!confirm('Yakin hapus / sembunyikan anggota ini?')) return;
    const all = getAllMembersList();
    const m = all[idx];
    if (!m) return;
    if (m._src === 'custom') {
        let custom = JSON.parse(localStorage.getItem('opa_custom_members')) || [];
        custom.splice(m._idx, 1);
        localStorage.setItem('opa_custom_members', JSON.stringify(custom));
    } else {
        let overrides = JSON.parse(localStorage.getItem('opa_member_overrides') || '{}');
        const key = m.id || m.nama;
        overrides[key] = overrides[key] || {};
        overrides[key].hidden = true;
        localStorage.setItem('opa_member_overrides', JSON.stringify(overrides));
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
    custom.push({ nama: nick.startsWith('OPA') ? nick : 'OPA • ' + nick, realname: real || nick, id: id || '-', jabatan: role, status: 'diterima', gender, online: 'offline', tanggal: new Date().toLocaleDateString('id-ID') });
    localStorage.setItem('opa_custom_members', JSON.stringify(custom));
    ['admin-new-nick','admin-new-real','admin-new-id'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    renderAdminMembersTable(); renderAnggotaList(); alert('Anggota ditambahkan!');
}

function applyUITheme(theme) {
    const classes = ['theme-emerald','theme-purple','theme-dark','theme-ocean','theme-rose','theme-gold','theme-crimson','theme-teal','theme-indigo','theme-sunset','theme-aurora'];
    document.body.classList.remove(...classes);
    const map = {
        'emerald-green': 'theme-emerald',
        'royal-purple': 'theme-purple',
        'dark-minimal': 'theme-dark',
        'ocean-blue': 'theme-ocean',
        'rose-pink': 'theme-rose',
        'gold-luxury': 'theme-gold',
        'crimson': 'theme-crimson',
        'teal': 'theme-teal',
        'indigo': 'theme-indigo',
        'sunset': 'theme-sunset',
        'aurora': 'theme-aurora'
    };
    if (map[theme]) document.body.classList.add(map[theme]);
    // reset custom color override when picking preset
    if (theme !== 'custom') {
        // leave --accent from theme CSS
    }
}
function applyUINavbar(style) { document.body.classList.toggle('navbar-compact', style === 'compact'); }
function saveUISettings() {
    const loginStyle = document.getElementById('ui-login-style')?.value || 'card';
    const loginBg = document.getElementById('ui-login-bg')?.value || 'light';
    const customColor = document.getElementById('ui-custom-color')?.value;
    localStorage.setItem('opa_ui_login_style', loginStyle);
    localStorage.setItem('opa_ui_login_bg', loginBg);
    if (customColor) localStorage.setItem('opa_ui_custom_color', customColor);
    previewLoginStyle(loginStyle);
    previewLoginBg(loginBg);
    if (customColor) applyCustomColor(customColor);

    const logoAnim = document.getElementById('ui-logo-anim')?.value || 'none';
    const pageAnim = document.getElementById('ui-page-anim')?.value || 'fade';
    const btnStyle = document.getElementById('ui-btn-style')?.value || 'rounded';
    localStorage.setItem('opa_ui_logo_anim', logoAnim);
    localStorage.setItem('opa_ui_page_anim', pageAnim);
    localStorage.setItem('opa_ui_btn_style', btnStyle);
    document.body.classList.remove('logo-anim-pulse','logo-anim-float','logo-anim-spin','logo-anim-glow','logo-anim-bounce','logo-anim-shake','logo-anim-swing','logo-anim-heartbeat','logo-anim-flip','logo-anim-zoom');
    if (logoAnim !== 'none') document.body.classList.add('logo-anim-' + (logoAnim === 'spin-slow' ? 'spin' : logoAnim));
    document.body.classList.remove('btn-style-pill','btn-style-sharp');
    if (btnStyle === 'pill') document.body.classList.add('btn-style-pill');
    if (btnStyle === 'sharp') document.body.classList.add('btn-style-sharp');
    document.body.dataset.pageAnim = pageAnim;

    const theme = document.getElementById('ui-theme-select')?.value || 'warm-orange';
    const navbar = document.getElementById('ui-navbar-select')?.value || 'default';
    const logo = document.getElementById('ui-logo-input')?.value || 'logo.png';
    localStorage.setItem('opa_ui_theme', theme); localStorage.setItem('opa_ui_navbar', navbar); localStorage.setItem('opa_ui_logo', logo);
    applyUITheme(theme); applyUINavbar(navbar);
    if (logo) document.querySelectorAll('img[src*="logo"], .login-guild-logo, .home-guild-logo-img, .brand img, .splash-logo').forEach(img => { if (img.id !== 'header-avatar') img.src = logo; });
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
    applyUITheme(theme); applyUINavbar(navbar);
}

function renderCSMessages() {
    const box = document.getElementById('cs-messages-box');
    if (!box) return;
    let msgs = JSON.parse(localStorage.getItem('opa_cs_chat')) || [{ sender: 'Help OPA • Police', text: 'Halo! Selamat datang di Pusat Bantuan Resmi Help OPA • Police. Silakan pilih salah satu menu di bawah.', time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) }];
    box.innerHTML = msgs.map(m => buildChatHTML(m, m.sender === currentUser || m.sender === 'Tamu')).join('');
    box.scrollTop = box.scrollHeight;
}
function openLoginCSModal() { alert('Pusat Bantuan CS Bot OPA • Police aktif.\n\nSilakan login terlebih dahulu untuk akses penuh.'); }
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
        csPush('1. Help Saya Mengganti Password', 'Terimakasih Telah Menghubungi OPA • Police. Kami Paham Saat Melupakan Password/Username. Silahkan Isi Formulir Ini Supaya Kami Bisa Kirim Informasi Ini ke Admin Buat Di Proses.');
        showCSForm('Lupa Password');
    } else if (type === 'daftar') {
        csPush('2. Cara Daftar Anggota', 'Panduan Daftar Anggota:\n1. Buka menu Registrasi Anggota\n2. Baca & setujui semua syarat\n3. Isi formulir data diri dengan benar\n4. Kirim pendaftaran\n5. Tunggu 1x24 jam, cek Status Anggota di menu Anggota');
    } else if (type === 'login') {
        csPush('3. Help Masalah Login', 'Silahkan isi formulir di bawah agar Admin bisa membantu masalah login Anda.');
        showCSForm('Masalah Login');
    } else if (type === 'admin') {
        csPush('4. Hubungkan Ke Admin', 'Permintaan terhubung ke Admin telah dicatat. Salah satu Admin (OPA • Maboo / OPA • Feyn) akan segera menghubungi Anda. Silakan cek juga menu Chat Grup & Pesan.');
    }
}
function showCSForm(laporanType) {
    const formArea = document.getElementById('cs-form-area');
    if (!formArea) return;
    formArea.classList.remove('hidden');
    formArea.innerHTML = `<h4 style="font-size:13px;margin-bottom:10px;">Isi Formulir — ${laporanType}</h4>
        <div class="input-group"><label>Nama</label><input type="text" id="cs-form-nama" placeholder="Nama lengkap / nickname"></div>
        <div class="input-group"><label>ID Game</label><input type="text" id="cs-form-id" placeholder="ID Free Fire"></div>
        <div class="input-group"><label>Username sebelumnya (opsional)</label><input type="text" id="cs-form-user" placeholder="Username lama"></div>
        <div class="input-group"><label>Laporan</label><input type="text" id="cs-form-laporan" value="${laporanType}" readonly></div>
        <button type="button" class="btn-primary btn-sm" onclick="submitCSForm('${laporanType}')">Kirim Formulir</button>`;
}
function submitCSForm(laporanType) {
    const nama = document.getElementById('cs-form-nama')?.value.trim();
    const id = document.getElementById('cs-form-id')?.value.trim();
    if (!nama || !id) return alert('Isi Nama dan ID Game!');
    const userOld = document.getElementById('cs-form-user')?.value.trim() || '-';
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

document.addEventListener('change', (e) => {
    if (e.target && e.target.name === 'reg-discord') {
        const wrap = document.getElementById('reg-discord-user-wrap');
        if (wrap) wrap.classList.toggle('hidden', e.target.value !== 'ya');
    }
});

function openProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    const u = currentUser || 'Guest';
    const nameEl = document.getElementById('profile-edit-username');
    const dispEl = document.getElementById('profile-edit-name');
    const roleEl = document.getElementById('profile-role-display');
    const av = document.getElementById('profile-avatar-big');
    if (nameEl) nameEl.value = u;
    const profiles = JSON.parse(localStorage.getItem('opa_profiles') || '{}');
    const p = profiles[u] || {};
    if (dispEl) dispEl.value = p.displayName || u;
    if (roleEl) roleEl.textContent = userRole || 'member';
    if (av) {
        if (p.photo) {
            av.style.backgroundImage = 'url(' + p.photo + ')';
            av.textContent = '';
        } else {
            av.style.backgroundImage = '';
            av.textContent = (u.charAt(0) || '?').toUpperCase();
        }
    }
    modal.classList.remove('hidden');
}
function closeProfileModal(e) {
    if (e && e.target !== e.currentTarget && !e.target.closest('.modal-close-btn')) return;
    document.getElementById('profile-modal')?.classList.add('hidden');
}
function changeProfilePhoto(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function() {
        const dataUrl = reader.result;
        const av = document.getElementById('profile-avatar-big');
        if (av) {
            av.style.backgroundImage = 'url(' + dataUrl + ')';
            av.style.backgroundSize = 'cover';
            av.textContent = '';
        }
        const hav = document.getElementById('header-avatar');
        if (hav) {
            if (hav.tagName === 'IMG') hav.src = dataUrl;
            else {
                hav.style.backgroundImage = 'url(' + dataUrl + ')';
                hav.style.backgroundSize = 'cover';
                hav.textContent = '';
            }
        }
        const u = currentUser || 'Guest';
        let profiles = JSON.parse(localStorage.getItem('opa_profiles') || '{}');
        profiles[u] = profiles[u] || {};
        profiles[u].photo = dataUrl;
        localStorage.setItem('opa_profiles', JSON.stringify(profiles));
    };
    reader.readAsDataURL(file);
}
function saveProfileChanges() {
    const newUser = document.getElementById('profile-edit-username')?.value.trim();
    const displayName = document.getElementById('profile-edit-name')?.value.trim();
    const pass1 = document.getElementById('profile-edit-password')?.value;
    const pass2 = document.getElementById('profile-edit-password2')?.value;
    if (!newUser) return alert('Username tidak boleh kosong!');
    if (pass1 || pass2) {
        if (pass1 !== pass2) return alert('Konfirmasi password tidak sama!');
        if (pass1.length < 4) return alert('Password minimal 4 karakter!');
    }
    let users = JSON.parse(localStorage.getItem('opa_users') || '{}');
    const old = currentUser;
    const oldKey = (old || '').toLowerCase();
    const newKey = newUser.toLowerCase();
    if (oldKey !== newKey && users[newKey]) return alert('Username sudah dipakai!');
    if (users[oldKey]) {
        const data = users[oldKey];
        if (pass1) data.password = pass1;
        delete users[oldKey];
        users[newKey] = data;
    } else if (pass1) {
        users[newKey] = { password: pass1, role: userRole || 'member' };
    }
    localStorage.setItem('opa_users', JSON.stringify(users));
    let profiles = JSON.parse(localStorage.getItem('opa_profiles') || '{}');
    const p = profiles[old] || profiles[oldKey] || {};
    p.displayName = displayName || newUser;
    profiles[newUser] = p;
    if (old && old !== newUser) delete profiles[old];
    localStorage.setItem('opa_profiles', JSON.stringify(profiles));
    currentUser = newUser;
    localStorage.setItem('opa_current_user', currentUser);
    renderUserInfo();
    alert('Profil berhasil disimpan!');
    closeProfileModal();
}

function pickTheme(btn) {
    document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const theme = btn.dataset.theme;
    const hidden = document.getElementById('ui-theme-select');
    if (hidden) hidden.value = theme;
    applyUITheme(theme);
    setTimeout(updateUIPreview, 30);
}
function applyCustomColor(hex) {
    document.documentElement.style.setProperty('--accent', hex);
    document.body.style.setProperty('--accent', hex);
    setTimeout(updateUIPreview, 30);
}
function previewLoginStyle(style) {
    document.body.classList.remove('login-style-glass','login-style-dark','login-style-minimal');
    if (style === 'glass') document.body.classList.add('login-style-glass');
    else if (style === 'dark') document.body.classList.add('login-style-dark');
    else if (style === 'minimal') document.body.classList.add('login-style-minimal');
}
function previewLoginBg(bg) {
    document.body.classList.remove('login-bg-gradient-orange','login-bg-gradient-dark','login-bg-gradient-purple','login-bg-gradient-ocean');
    if (bg && bg !== 'light') document.body.classList.add('login-bg-' + bg);
}

function updateUIPreview() {
    // Logo anim
    const logoAnim = document.getElementById('ui-logo-anim')?.value || 'none';
    document.body.classList.remove('logo-anim-pulse','logo-anim-float','logo-anim-spin','logo-anim-glow','logo-anim-bounce','logo-anim-shake','logo-anim-swing','logo-anim-heartbeat','logo-anim-flip','logo-anim-zoom');
    if (logoAnim !== 'none') {
        document.body.classList.add('logo-anim-' + (logoAnim === 'spin-slow' ? 'spin' : logoAnim));
    }
    // Button style
    const btnStyle = document.getElementById('ui-btn-style')?.value || 'rounded';
    document.body.classList.remove('btn-style-pill','btn-style-sharp');
    if (btnStyle === 'pill') document.body.classList.add('btn-style-pill');
    if (btnStyle === 'sharp') document.body.classList.add('btn-style-sharp');
    // Logo src
    const logoUrl = document.getElementById('ui-logo-input')?.value || 'logo.png';
    const prevLogo = document.getElementById('ui-preview-logo');
    if (prevLogo && logoUrl) {
        prevLogo.style.display = '';
        prevLogo.src = logoUrl;
    }
    // Accent on preview btn (inherits --accent)
    const btn = document.getElementById('ui-preview-btn');
    if (btn) btn.style.background = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#f97316';
    const chips = document.querySelectorAll('.ui-preview-chip');
    chips.forEach(c => { c.style.background = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#f97316'; });
}

// enhance pickTheme to refresh preview

document.getElementById('ui-logo-input')?.addEventListener('input', updateUIPreview);

function applyChatUI() {
    const bubble = document.getElementById('ui-chat-bubble')?.value || 'rounded';
    const chatBg = document.getElementById('ui-chat-bg')?.value || 'default';
    const bubbleColor = document.getElementById('ui-chat-bubble-color')?.value;
    document.body.classList.remove('chat-bubble-soft','chat-bubble-sharp','chat-bubble-pill');
    if (bubble === 'soft') document.body.classList.add('chat-bubble-soft');
    else if (bubble === 'sharp') document.body.classList.add('chat-bubble-sharp');
    else if (bubble === 'pill') document.body.classList.add('chat-bubble-pill');
    document.body.classList.remove('chat-bg-dim','chat-bg-tint','chat-bg-dark');
    if (chatBg === 'dim') document.body.classList.add('chat-bg-dim');
    else if (chatBg === 'tint') document.body.classList.add('chat-bg-tint');
    else if (chatBg === 'dark') document.body.classList.add('chat-bg-dark');
    if (bubbleColor) document.documentElement.style.setProperty('--chat-out-bg', bubbleColor);
    localStorage.setItem('opa_ui_chat_bubble', bubble);
    localStorage.setItem('opa_ui_chat_bg', chatBg);
    if (bubbleColor) localStorage.setItem('opa_ui_chat_bubble_color', bubbleColor);
    updateUIPreview();
}
function loadChatUIControls() {
    const b = localStorage.getItem('opa_ui_chat_bubble') || 'rounded';
    const g = localStorage.getItem('opa_ui_chat_bg') || 'default';
    const c = localStorage.getItem('opa_ui_chat_bubble_color');
    const elB = document.getElementById('ui-chat-bubble'); if (elB) elB.value = b;
    const elG = document.getElementById('ui-chat-bg'); if (elG) elG.value = g;
    const elC = document.getElementById('ui-chat-bubble-color'); if (elC && c) elC.value = c;
    document.body.classList.remove('chat-bubble-soft','chat-bubble-sharp','chat-bubble-pill');
    if (b === 'soft') document.body.classList.add('chat-bubble-soft');
    else if (b === 'sharp') document.body.classList.add('chat-bubble-sharp');
    else if (b === 'pill') document.body.classList.add('chat-bubble-pill');
    document.body.classList.remove('chat-bg-dim','chat-bg-tint','chat-bg-dark');
    if (g === 'dim') document.body.classList.add('chat-bg-dim');
    else if (g === 'tint') document.body.classList.add('chat-bg-tint');
    else if (g === 'dark') document.body.classList.add('chat-bg-dark');
    if (c) document.documentElement.style.setProperty('--chat-out-bg', c);
}
