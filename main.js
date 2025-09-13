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

// Supabase config
const SUPABASE_URL = "https://clpvctamagdfrmgswdta.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNscHZjdGFtYWdkZnJtZ3N3ZHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NDgwNTEsImV4cCI6MjA3MzMyNDA1MX0.7gpiGlT6B5LOtnRcasA8sbmnTWI2ZBJcZb66lxQg4gQ";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Навигация и модальное окно
const navLoginBtn = document.getElementById('nav-login-btn');
const navLogoutBtn = document.getElementById('nav-logout-btn');
const navUser = document.getElementById('nav-user');
const authModal = document.getElementById('auth-modal');
const authModalClose = document.getElementById('auth-modal-close');
const authForm = document.getElementById('auth-form');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = navLogoutBtn; // Используем кнопку из навбара
const authMessage = document.getElementById('auth-message');

// Открыть модальное окно
navLoginBtn.addEventListener('click', () => {
    authModal.style.display = 'block';
});

// Закрыть модальное окно
authModalClose.addEventListener('click', () => {
    authModal.style.display = 'none';
    authMessage.textContent = '';
});

// Закрыть по клику вне окна
window.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.style.display = 'none';
        authMessage.textContent = '';
    }
});

// Проверка авторизации при загрузке
async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    updateAuthUI(user);
}

function updateAuthUI(user) {
    if (user) {
        navLoginBtn.style.display = 'none';
        navUser.style.display = 'inline-block';
        navUser.textContent = user.email;
        navLogoutBtn.style.display = 'inline-block';
        authModal.style.display = 'none';
        authMessage.textContent = '';
    } else {
        navLoginBtn.style.display = 'inline-block';
        navUser.style.display = 'none';
        navUser.textContent = '';
        navLogoutBtn.style.display = 'none';
    }
}

authForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        authMessage.textContent = 'Ошибка входа: ' + error.message;
    } else {
        checkAuth();
    }
});

registerBtn.addEventListener('click', async function(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
        authMessage.textContent = 'Ошибка регистрации: ' + error.message;
    } else {
        authMessage.textContent = 'Регистрация успешна! Проверьте почту для подтверждения.';
    }
});

navLogoutBtn.addEventListener('click', async function() {
    await supabase.auth.signOut();
    checkAuth();
});

// Проверить статус при загрузке страницы
checkAuth();
