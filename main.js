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

// Навигация и модальное окно элементы (добавлены новые элементы для OTP/Google)
const navLoginBtn = document.getElementById('nav-login-btn');
const navLogoutBtn = document.getElementById('nav-logout-btn');
const navUser = document.getElementById('nav-user');
const authModal = document.getElementById('auth-modal');
const authModalClose = document.getElementById('auth-modal-close');

const sendOtpBtn = document.getElementById('send-otp-btn');
const verifyOtpBtn = document.getElementById('verify-otp-btn');
const authPhone = document.getElementById('auth-phone');
const authOtp = document.getElementById('auth-otp');
const otpBlock = document.getElementById('otp-block');
const googleBtn = document.getElementById('google-btn');
const authMessage = document.getElementById('auth-message');

// Открыть/закрыть модал
navLoginBtn.addEventListener('click', () => {
    authModal.style.display = 'block';
    authModal.setAttribute('aria-hidden', 'false');
});
authModalClose.addEventListener('click', () => {
    authModal.style.display = 'none';
    authModal.setAttribute('aria-hidden', 'true');
    clearAuthUI();
});
window.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.style.display = 'none';
        authModal.setAttribute('aria-hidden', 'true');
        clearAuthUI();
    }
});

function clearAuthUI() {
    authMessage.textContent = '';
    authPhone.value = '';
    authOtp.value = '';
    otpBlock.style.display = 'none';
}

// Проверка авторизации при загрузке
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    updateAuthUI(user);
}

function updateAuthUI(user) {
    if (user) {
        navLoginBtn.style.display = 'none';
        navUser.style.display = 'inline-block';
        navUser.textContent = user.email || user.phone || 'Профиль';
        navLogoutBtn.style.display = 'inline-block';
        authModal.style.display = 'none';
        authModal.setAttribute('aria-hidden', 'true');
        clearAuthUI();
    } else {
        navLoginBtn.style.display = 'inline-block';
        navUser.style.display = 'none';
        navUser.textContent = '';
        navLogoutBtn.style.display = 'none';
    }
}

// Отправка OTP на телефон
sendOtpBtn.addEventListener('click', async () => {
    const phone = authPhone.value.trim();
    authMessage.textContent = '';
    if (!phone || !/^\+\d{7,15}$/.test(phone)) {
        authMessage.textContent = 'Введите корректный номер в международном формате, например +71234567890';
        return;
    }
    authMessage.textContent = 'Отправка кода...';
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
        authMessage.textContent = 'Ошибка отправки кода: ' + error.message;
    } else {
        authMessage.textContent = 'Код отправлен. Введите код из SMS.';
        otpBlock.style.display = 'block';
    }
});

// Подтверждение OTP
verifyOtpBtn.addEventListener('click', async () => {
    const phone = authPhone.value.trim();
    const token = authOtp.value.trim();
    authMessage.textContent = '';
    if (!token) {
        authMessage.textContent = 'Введите код из SMS.';
        return;
    }
    authMessage.textContent = 'Проверка кода...';
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    if (error) {
        authMessage.textContent = 'Ошибка подтверждения: ' + error.message;
    } else {
        authMessage.textContent = 'Успешно! Вы вошли.';
        await checkAuth();
    }
});

// Вход через Google OAuth
googleBtn.addEventListener('click', async () => {
    authMessage.textContent = '';
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
    });
});

// Выход
navLogoutBtn.addEventListener('click', async function() {
    await supabase.auth.signOut();
    checkAuth();
});

// Инициалная проверка
checkAuth();
