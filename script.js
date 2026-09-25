// ============ PAGE NAVIGATION ============
const pages = Array.from(document.querySelectorAll('.page'));
let currentPage = 1;
let history = [1];

function goToPage(pageNum, direction = 'forward') {
  const current = pages.find(p => p.classList.contains('active'));
  const next = pages.find(p => Number(p.dataset.page) === pageNum);
  if (!next || next === current) return;

  if (current) {
    current.classList.remove('active');
    if (direction === 'back') current.classList.add('leaving-back');
  }

  // force reflow so transition replays cleanly
  void next.offsetWidth;

  next.classList.remove('leaving-back');
  next.classList.add('active');
  currentPage = pageNum;

  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  setTimeout(() => {
    if (current) current.classList.remove('leaving-back');
  }, 520);
}

function goBack() {
  history.pop();
  const prev = history[history.length - 1] || 1;
  goToPage(prev, 'back');
}

function goForward(pageNum) {
  history.push(pageNum);
  goToPage(pageNum, 'forward');
}

// ============ ANTI-SPAM: SUDAH DAFTAR CHECK (cooldown 24 jam) ============
const STORAGE_KEY = 'opaGuildRegistration';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 jam

function getSavedRegistration() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const submittedAt = parsed.submittedAt || 0;
    const elapsed = Date.now() - submittedAt;

    if (elapsed >= COOLDOWN_MS) {
      // cooldown sudah lewat, hapus data lama supaya bisa isi ulang
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch (err) {
    return null;
  }
}

function saveRegistration(data) {
  try {
    const payload = { ...data, submittedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    // localStorage unavailable — fail silently, worst case they can resubmit
  }
}

function formatRemainingTime(submittedAt) {
  const remainingMs = COOLDOWN_MS - (Date.now() - submittedAt);
  if (remainingMs <= 0) return null;
  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours} jam ${minutes} menit lagi`;
  return `${minutes} menit lagi`;
}

function renderSummary(data) {
  const box = document.getElementById('summaryBox');
  const rows = [
    ['Nama lengkap', data.namaLengkap],
    ['Nama in-game', data.nama],
    ['ID Free Fire', data.idGame],
    ['Gender', data.gender],
    ['Level akun', data.level],
    ['Waktu CN', data.waktuCN],
    ['Usia', data.usia],
    ['No. HP/WA', data.hp],
    ['Email', data.email],
    ['Discord', data.hasDiscord === 'ya' ? data.discordUsername : 'Tidak punya']
  ];
  box.innerHTML = rows.map(([label, value]) => `
    <div class="summary__row">
      <span class="summary__label">${label}</span>
      <span class="summary__value">${escapeHtml(value || '-')}</span>
    </div>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById('btnDaftar').addEventListener('click', () => {
  const saved = getSavedRegistration();
  if (saved) {
    showAlreadyRegistered(saved);
  } else {
    goForward(2);
  }
});

function showAlreadyRegistered(data) {
  const remaining = formatRemainingTime(data.submittedAt);
  document.getElementById('successTitle').textContent = 'Kamu sudah terdaftar';
  document.getElementById('successSubtitle').textContent = remaining
    ? `Kamu bisa isi form lagi dalam ${remaining}. Ini data yang sudah kamu kirim sebelumnya.`
    : 'Ini data yang sudah kamu kirim sebelumnya.';
  document.querySelector('.page--success').classList.add('already-registered');
  renderSummary(data);
  history = [1, 5];
  goToPage(5, 'forward');
}

document.getElementById('btnToFacilities').addEventListener('click', () => goForward(3));
document.getElementById('btnToForm').addEventListener('click', () => goForward(4));

document.querySelectorAll('[data-back]').forEach(btn => {
  btn.addEventListener('click', goBack);
});

// ============ RULES AGREEMENT CHECKBOX ============
const agreeCheck = document.getElementById('agreeCheck');
const btnToFacilities = document.getElementById('btnToFacilities');

agreeCheck.addEventListener('change', () => {
  btnToFacilities.disabled = !agreeCheck.checked;
});

// ============ DISCORD CONDITIONAL FIELD ============
const discordField = document.getElementById('discordField');
const discordUsername = document.getElementById('discordUsername');
const discordRadios = document.querySelectorAll('input[name="hasDiscord"]');

discordRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'ya' && radio.checked) {
      discordField.classList.add('open');
      discordUsername.setAttribute('required', 'required');
    } else if (radio.value === 'tidak' && radio.checked) {
      discordField.classList.remove('open');
      discordUsername.removeAttribute('required');
      discordUsername.value = '';
      clearError('discordUsername');
    }
  });
});

// ============ FORM VALIDATION ============
const form = document.getElementById('regForm');

function showError(fieldName, message) {
  const input = document.getElementById(fieldName);
  const errorEl = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (input) input.classList.add('invalid');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }
}

function clearError(fieldName) {
  const input = document.getElementById(fieldName);
  const errorEl = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (input) input.classList.remove('invalid');
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('show');
  }
}

function clearAllErrors() {
  form.querySelectorAll('.field__error').forEach(el => {
    el.textContent = '';
    el.classList.remove('show');
  });
  form.querySelectorAll('input.invalid').forEach(el => el.classList.remove('invalid'));
}

// Indonesian phone number validation:
// accepts 08xxxxxxxxx (10-13 digits) or +62/62 prefix
function isValidPhoneNumber(value) {
  const cleaned = value.replace(/[\s-]/g, '');
  const patterns = [
    /^08[0-9]{8,11}$/,       // 08xxxxxxxxxx (10-13 digits total)
    /^\+628[0-9]{8,11}$/,    // +628xxxxxxxxxx
    /^628[0-9]{8,11}$/       // 628xxxxxxxxxx
  ];
  return patterns.some(p => p.test(cleaned));
}

function validateForm() {
  clearAllErrors();
  let isValid = true;

  const namaLengkap = document.getElementById('namaLengkap').value.trim();
  const nama = document.getElementById('nama').value.trim();
  const idGame = document.getElementById('idGame').value.trim();
  const genderChecked = document.querySelector('input[name="gender"]:checked');
  const level = document.getElementById('level').value.trim();
  const waktuCN = document.getElementById('waktuCN').value;
  const usia = document.getElementById('usia').value.trim();
  const hp = document.getElementById('hp').value.trim();
  const hasDiscordChecked = document.querySelector('input[name="hasDiscord"]:checked');

  if (!namaLengkap) {
    showError('namaLengkap', 'Nama lengkap wajib diisi');
    isValid = false;
  }

  if (!nama) {
    showError('nama', 'Nama in-game wajib diisi');
    isValid = false;
  }

  if (!idGame) {
    showError('idGame', 'ID Free Fire wajib diisi');
    isValid = false;
  } else if (!/^[0-9]{6,12}$/.test(idGame)) {
    showError('idGame', 'ID Free Fire harus berupa angka (6-12 digit)');
    isValid = false;
  }

  if (!genderChecked) {
    showError('gender', 'Pilih salah satu');
    isValid = false;
  }

  if (!level) {
    showError('level', 'Level akun wajib diisi');
    isValid = false;
  } else if (Number(level) < 40) {
    showError('level', 'Minimum level akun adalah 40');
    isValid = false;
  }

  if (!waktuCN) {
    showError('waktuCN', 'Pilih waktu CN');
    isValid = false;
  }

  if (!usia) {
    showError('usia', 'Usia wajib diisi');
    isValid = false;
  } else if (Number(usia) < 18) {
    showError('usia', 'Usia minimum adalah 18 tahun');
    isValid = false;
  }

  if (!hp) {
    showError('hp', 'Nomor HP/WA wajib diisi');
    isValid = false;
  } else if (!isValidPhoneNumber(hp)) {
    showError('hp', 'Format nomor tidak valid. Contoh: 081234567890');
    isValid = false;
  }

  const email = document.getElementById('email').value.trim();
  if (!email) {
    showError('email', 'Email wajib diisi');
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError('email', 'Format email tidak valid');
    isValid = false;
  }

  if (!hasDiscordChecked) {
    showError('hasDiscord', 'Pilih salah satu');
    isValid = false;
  } else if (hasDiscordChecked.value === 'ya') {
    const username = discordUsername.value.trim();
    if (!username) {
      showError('discordUsername', 'Username Discord wajib diisi');
      isValid = false;
    }
  }

  return isValid;
}

// live-clear error as user types/fixes
['namaLengkap', 'nama', 'idGame', 'level', 'usia', 'hp', 'email', 'waktuCN', 'discordUsername'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => clearError(id));
  el.addEventListener('change', () => clearError(id));
});

document.querySelectorAll('input[name="gender"]').forEach(radio => {
  radio.addEventListener('change', () => clearError('gender'));
});

const btnSubmit = document.getElementById('btnSubmit');
const submitErrorBox = document.createElement('p');
submitErrorBox.className = 'submit-error';
submitErrorBox.style.cssText = 'color:#ff5c5c;font-size:13px;text-align:center;margin-top:14px;display:none;';
form.appendChild(submitErrorBox);

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const alreadySaved = getSavedRegistration();
  if (alreadySaved) {
    showAlreadyRegistered(alreadySaved);
    return;
  }

  if (!validateForm()) {
    const firstInvalid = form.querySelector('.invalid, [data-error-for].show');
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  submitErrorBox.style.display = 'none';
  btnSubmit.disabled = true;
  btnSubmit.querySelector('span').textContent = 'Mengirim...';

  try {
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const submittedData = {
        namaLengkap: document.getElementById('namaLengkap').value.trim(),
        nama: document.getElementById('nama').value.trim(),
        idGame: document.getElementById('idGame').value.trim(),
        gender: document.querySelector('input[name="gender"]:checked').value,
        level: document.getElementById('level').value.trim(),
        waktuCN: document.getElementById('waktuCN').value,
        usia: document.getElementById('usia').value.trim(),
        hp: document.getElementById('hp').value.trim(),
        email: document.getElementById('email').value.trim(),
        hasDiscord: document.querySelector('input[name="hasDiscord"]:checked').value,
        discordUsername: discordUsername.value.trim()
      };
      saveRegistration(submittedData);
      document.getElementById('successTitle').textContent = 'Pendaftaran terkirim';
      document.getElementById('successSubtitle').textContent = 'Admin OPA akan menghubungi kamu lewat WhatsApp untuk proses selanjutnya.';
      document.querySelector('.page--success').classList.remove('already-registered');
      renderSummary(submittedData);
      goForward(5);
      form.reset();
    } else {
      throw new Error('Gagal mengirim');
    }
  } catch (err) {
    submitErrorBox.textContent = 'Gagal mengirim pendaftaran. Cek koneksi internet kamu dan coba lagi.';
    submitErrorBox.style.display = 'block';
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.querySelector('span').textContent = 'Kirim Pendaftaran';
  }
});

// ============ KEMBALI KE MENU AWAL ============
document.getElementById('btnRestart').addEventListener('click', () => {
  history = [1];
  goToPage(1, 'back');
});

document.getElementById('btnRestartFromCN').addEventListener('click', () => {
  history = [1];
  goToPage(1, 'back');
});

// ============ HALAMAN FORMAT CN ============
document.getElementById('btnToCN').addEventListener('click', () => {
  const saved = getSavedRegistration();
  if (!saved) return;

  const prefix = saved.gender === 'Perempuan' ? 'OMA' : 'OPA';
  const format = `${prefix} • ${saved.nama}`;

  document.getElementById('cnGenderLabel').textContent =
    saved.gender === 'Perempuan' ? 'Format kamu (Perempuan)' : 'Format kamu (Laki-laki)';
  document.getElementById('cnFormatValue').textContent = format;

  goForward(6);
});

document.getElementById('btnCopyCN').addEventListener('click', async () => {
  const text = document.getElementById('cnFormatValue').textContent;
  const btn = document.getElementById('btnCopyCN');

  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    // fallback for browsers without clipboard API permission
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
  }

  btn.classList.add('copied');
  btn.querySelector('span').textContent = 'Tersalin!';
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.querySelector('span').textContent = 'Salin format';
  }, 1800);
});
