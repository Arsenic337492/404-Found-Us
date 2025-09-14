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

// Привязка выхода и первичная проверка
navLogoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    checkAuth();
});

checkAuth();

// флаги по коду страны (emoji). Можно расширить.
const COUNTRY_FLAGS = {
    '+7': '🇷🇺',
    '+1': '🇺🇸',
    '+44': '🇬🇧',
    // добавь при необходимости
};

const phoneFlagEl = document.getElementById('auth-phone-flag');

// Обновлять флаг при смене селекта
function updatePhoneFlag() {
    const code = (phoneCodeSelect.value || '+7');
    phoneFlagEl.textContent = COUNTRY_FLAGS[code] || '🌐';
}
phoneCodeSelect.addEventListener('change', () => {
    updatePhoneFlag();
    // при смене кода можно переформатировать текущий ввод
    formatPhoneInput();
});
// initial
updatePhoneFlag();

// Форматирование локальной части номера в секции (примерно 3-3-4)
function formatPhoneInput() {
    // сохраняем позицию курсора простым способом: будущее можно улучшить
    const raw = (authPhone.value || '').replace(/\D/g, '');
    // выбери шаблон: для большинства используем [3,3,4], можно расширять по стране
    const code = (phoneCodeSelect.value || '+7');
    let groups = [3,3,4];
    // допустим, для +44 хотим [4,3,4] (пример)
    if (code === '+44') groups = [4,3,4];
    if (code === '+1') groups = [3,3,4];
    if (code === '+7') groups = [3,3,4];

    let remaining = raw;
    const parts = [];
    for (let i = 0; i < groups.length && remaining.length > 0; i++) {
        const take = Math.min(groups[i], remaining.length);
        parts.push(remaining.slice(0, take));
        remaining = remaining.slice(take);
    }
    // если остались цифры, добавь в последний кусок с пробелом
    if (remaining.length > 0) parts.push(remaining);

    // собрать строку: первые часть в скобки, остальные с пробелами
    let formatted = '';
    if (parts.length > 0) {
        // если есть минимум 1 блок — ставим в скобки первый блок
        formatted = parts[0];
        if (parts.length > 1) {
            formatted = `(${parts[0]}) ${parts.slice(1).join(' ')}`;
        } else {
            // если только один кусок — оставить без скобок, но можно показать как (xxx)
            formatted = parts[0];
        }
    }
    // записать формат в поле
    authPhone.value = formatted;
}

// форматировать при вводе / вставке
authPhone.addEventListener('input', () => {
    // сохраняем cursor простым способом: форматируем всегда (может изменить caret — достаточная MVP реализация)
    formatPhoneInput();
});

// при фокусе/blur можно показывать подсказку
authPhone.addEventListener('focus', () => {
    // убрать лишние символы для удобства, но оставим форматирование
    formatPhoneInput();
});
