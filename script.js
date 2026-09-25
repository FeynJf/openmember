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

document.getElementById('btnDaftar').addEventListener('click', () => goForward(2));
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

  const nama = document.getElementById('nama').value.trim();
  const idGame = document.getElementById('idGame').value.trim();
  const level = document.getElementById('level').value.trim();
  const usia = document.getElementById('usia').value.trim();
  const hp = document.getElementById('hp').value.trim();
  const hasDiscordChecked = document.querySelector('input[name="hasDiscord"]:checked');

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

  if (!level) {
    showError('level', 'Level akun wajib diisi');
    isValid = false;
  } else if (Number(level) < 40) {
    showError('level', 'Minimum level akun adalah 40');
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
['nama', 'idGame', 'level', 'usia', 'hp', 'email', 'discordUsername'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => clearError(id));
});

const btnSubmit = document.getElementById('btnSubmit');
const submitErrorBox = document.createElement('p');
submitErrorBox.className = 'submit-error';
submitErrorBox.style.cssText = 'color:#ff5c5c;font-size:13px;text-align:center;margin-top:14px;display:none;';
form.appendChild(submitErrorBox);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
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

// ============ RESTART FORM ============
document.getElementById('btnRestart').addEventListener('click', () => {
  form.reset();
  clearAllErrors();
  discordField.classList.remove('open');
  discordUsername.removeAttribute('required');
  agreeCheck.checked = false;
  btnToFacilities.disabled = true;
  history = [1];
  goToPage(1, 'back');
});
