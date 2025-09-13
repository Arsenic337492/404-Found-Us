const photoInput = document.getElementById('photo-input');
const preview = document.getElementById('preview');
const result = document.getElementById('result');
const dropZone = document.getElementById('drop-zone');
const clearBtn = document.getElementById('clear-btn');
const spinner = document.getElementById('spinner');

const MAX_SIZE_MB = 5;

function showSpinner(show) {
    spinner.style.display = show ? 'block' : 'none';
}

function validateFile(file) {
    if (!file.type.startsWith('image/')) {
        result.textContent = 'Ошибка: можно загружать только изображения.';
        return false;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        result.textContent = `Ошибка: максимальный размер файла — ${MAX_SIZE_MB} МБ.`;
        return false;
    }
    return true;
}

function showPreview(file) {
    preview.innerHTML = '';
    result.textContent = '';
    if (!validateFile(file)) return;
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = () => URL.revokeObjectURL(img.src);
    preview.appendChild(img);
    clearBtn.style.display = 'inline-block';
    // Здесь можно показать спиннер, если отправляем на сервер
    // showSpinner(true);
    // setTimeout(() => { showSpinner(false); result.textContent = 'Результат появится здесь.'; }, 1200);
}

photoInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) showPreview(file);
});

clearBtn.addEventListener('click', function() {
    photoInput.value = '';
    preview.innerHTML = '';
    result.textContent = '';
    clearBtn.style.display = 'none';
});

dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', function(e) {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
        photoInput.value = '';
        showPreview(file);
    }
});

// Tooltip для drop-zone
dropZone.addEventListener('mouseenter', () => {
    dropZone.title = 'Перетащите изображение или выберите файл выше';
});
dropZone.addEventListener('mouseleave', () => {
    dropZone.title = 'Перетащите изображение сюда';
});

// Supabase config (остается прежним)
const SUPABASE_URL = "https://clpvctamagdfrmgswdta.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNscHZjdGFtYWdkZnJtZ3N3ZHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NDgwNTEsImV4cCI6MjA3MzMyNDA1MX0.7gpiGlT6B5LOtnRcasA8sbmnTWI2ZBJcZb66lxQg4gQ";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Новые элементы (auth modal)
const authModal = document.getElementById('auth-modal');
const authModalClose = document.getElementById('auth-modal-close');
const navLoginBtn = document.getElementById('nav-login-btn');
const navLogoutBtn = document.getElementById('nav-logout-btn');
const navUser = document.getElementById('nav-user');

const phoneCodeSelect = document.getElementById('auth-phone-code');
const authPhone = document.getElementById('auth-phone');
const sendOtpBtn = document.getElementById('send-otp-btn');

const stepPhone = document.getElementById('auth-step-phone');
const stepOtp = document.getElementById('auth-step-otp');
const otpTarget = document.getElementById('otp-target');
const authOtp = document.getElementById('auth-otp');
const verifyOtpBtn = document.getElementById('verify-otp-btn');
const changeNumberBtn = document.getElementById('change-number-btn');
const resendOtpBtn = document.getElementById('resend-otp-btn');
const resendTimerEl = document.getElementById('resend-timer');
const googleBtn = document.getElementById('google-btn');

const authMessageMain = document.getElementById('auth-message');
const authMessageOtp = document.getElementById('auth-message-otp');

let resendTimer = null;
let resendSeconds = 0;

function openAuth() {
    authModal.style.display = 'block';
    authModal.setAttribute('aria-hidden', 'false');
    stepPhone.style.display = 'block';
    stepOtp.style.display = 'none';
    authMessageMain.textContent = '';
    authMessageOtp.textContent = '';
    authPhone.focus();
}

function closeAuth() {
    authModal.style.display = 'none';
    authModal.setAttribute('aria-hidden', 'true');
    clearAuthState();
}

function clearAuthState() {
    authPhone.value = '';
    authOtp.value = '';
    otpTarget.textContent = '';
    stopResendTimer();
    resendOtpBtn.disabled = true;
    resendTimerEl.textContent = '';
    authMessageMain.textContent = '';
    authMessageOtp.textContent = '';
}

navLoginBtn.addEventListener('click', openAuth);
authModalClose.addEventListener('click', closeAuth);
window.addEventListener('click', (e) => { if (e.target === authModal) closeAuth(); });

// Start resend timer (60s)
function startResendTimer(sec = 60) {
    resendSeconds = sec;
    resendOtpBtn.disabled = true;
    updateResendUI();
    resendTimer = setInterval(() => {
        resendSeconds--;
        updateResendUI();
        if (resendSeconds <= 0) stopResendTimer();
    }, 1000);
}
function updateResendUI() {
    if (resendSeconds > 0) {
        resendTimerEl.textContent = `через ${resendSeconds}s`;
        resendOtpBtn.disabled = true;
    } else {
        resendTimerEl.textContent = '';
        resendOtpBtn.disabled = false;
    }
}
function stopResendTimer() {
    if (resendTimer) { clearInterval(resendTimer); resendTimer = null; }
    resendSeconds = 0;
    updateResendUI();
}

// Объединить код страны и номер в E.164-ish (пользовательский ввод минимально обработан)
function buildPhoneE164() {
    const code = (phoneCodeSelect.value || '+7').trim();
    let phone = (authPhone.value || '').replace(/\D/g, '');
    // если пользователь ввёл полный номер (с ведущим 8/7), не дублируем
    if (phone.startsWith('8') && code === '+7') phone = phone.slice(1);
    return code + phone;
}

// Отправка OTP
sendOtpBtn.addEventListener('click', async () => {
    authMessageMain.textContent = '';
    const fullPhone = buildPhoneE164();
    if (!/^\+\d{7,15}$/.test(fullPhone)) {
        authMessageMain.textContent = 'Введите корректный номер в международном формате.';
        return;
    }
    sendOtpBtn.disabled = true;
    authMessageMain.textContent = 'Отправка кода...';
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    sendOtpBtn.disabled = false;
    if (error) {
        authMessageMain.textContent = 'Ошибка отправки: ' + error.message;
    } else {
        // Переходим к шагу ввода OTP
        otpTarget.textContent = fullPhone;
        stepPhone.style.display = 'none';
        stepOtp.style.display = 'block';
        authOtp.focus();
        authMessageMain.textContent = '';
        authMessageOtp.textContent = 'Код отправлен.';
        startResendTimer(60);
    }
});

// Повторная отправка (resend)
resendOtpBtn.addEventListener('click', async () => {
    resendOtpBtn.disabled = true;
    authMessageOtp.textContent = 'Повторная отправка...';
    const fullPhone = buildPhoneE164();
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    if (error) {
        authMessageOtp.textContent = 'Ошибка отправки: ' + error.message;
    } else {
        authMessageOtp.textContent = 'Код отправлен повторно.';
        startResendTimer(60);
    }
});

// Изменить номер
changeNumberBtn.addEventListener('click', () => {
    stepOtp.style.display = 'none';
    stepPhone.style.display = 'block';
    clearAuthState();
});

// Подтверждение OTP
verifyOtpBtn.addEventListener('click', async () => {
    authMessageOtp.textContent = '';
    const token = authOtp.value.trim();
    const phone = buildPhoneE164();
    if (!token) { authMessageOtp.textContent = 'Введите код из SMS.'; return; }
    verifyOtpBtn.disabled = true;
    authMessageOtp.textContent = 'Проверка кода...';
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    verifyOtpBtn.disabled = false;
    if (error) {
        authMessageOtp.textContent = 'Ошибка подтверждения: ' + error.message;
    } else {
        authMessageOtp.textContent = 'Успешно! Вы вошли.';
        await checkAuth(); // обновит navbar
        closeAuth();
    }
});

// Google OAuth (использует redirect по дефолту)
googleBtn.addEventListener('click', async () => {
    authMessageMain.textContent = '';
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
});

// Привязка выхода и первичная проверка
navLogoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    checkAuth();
});

checkAuth();
