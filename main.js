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

// Safely wire auth modal only if page contains modal elements (in-check.html has modal)
const authModal = document.getElementById('auth-modal');
if (authModal) {
    const authModalClose = document.getElementById('auth-modal-close');
    const navLoginBtn = document.getElementById('nav-login-btn') || document.getElementById('nav-login'); // fallback
    const navLogoutBtn = document.getElementById('nav-logout-btn');
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

    // Объединить код страны и номер в E.164-ish (умнее, не дублируем код)
    function buildPhoneE164() {
        const code = (phoneCodeSelect.value || '+7').trim(); // "+7"
        const codeDigits = code.replace(/^\+/, ''); // "7"
        let raw = (authPhone.value || '').trim();

        // Если пользователь ввёл с ведущим '+', используем как есть (но очищаем лишние символы)
        if (raw.startsWith('+')) {
            const digits = raw.replace(/\D/g, '');
            return '+' + digits;
        }

        // Убираем все не-цифры
        let phone = raw.replace(/\D/g, '');

        // Если пользователь ввёл полный номер с кодом (например "77077608153") и начало совпадает с кодом страны,
        // считаем, что это уже полный e.164 без '+'
        if (phone.startsWith(codeDigits)) {
            return '+' + phone;
        }

        // Специальный случай: если ввели номер с ведущей 8 для РФ (+7), убираем 8
        if (code === '+7' && phone.startsWith('8')) {
            phone = phone.slice(1);
        }

        return code + phone;
    }

    // Улучшенная проверка международного формата (принимает +digits или digits, но результат должен быть валидным e164)
    function isLikelyValidPhone(e164) {
        // простой чек длины и знак +
        return typeof e164 === 'string' && /^\+\d{7,15}$/.test(e164);
    }

    // Отправка OTP (с расширенной обработкой ошибок)
    sendOtpBtn.addEventListener('click', async () => {
        authMessageMain.textContent = '';
        const fullPhone = buildPhoneE164();

        if (!isLikelyValidPhone(fullPhone)) {
            authMessageMain.textContent = 'Введите корректный номер в международном формате. Пример: +7 701 234 5678 или введите только местный номер и выберите код страны.';
            return;
        }

        sendOtpBtn.disabled = true;
        authMessageMain.textContent = 'Отправка кода...';
        try {
            const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
            sendOtpBtn.disabled = false;
            if (error) {
                // Специфичная обработка для провайдера SMS
                const msg = (error.message || '').toString();
                if (/unsupported phone provider|Unsupported phone provider/i.test(msg) || /provider/i.test(msg)) {
                    authMessageMain.innerHTML = 'Этот номер не поддерживается SMS-провайдером. Попробуйте войти через Google или используйте другой номер. Если проблема повторяется — свяжитесь с поддержкой.';
                    // дать визуальную подсказку: показать кнопку Google явно
                    // (кнопка уже есть в модалке, можно сфокусировать на ней)
                    googleBtn.focus();
                    return;
                }
                authMessageMain.textContent = 'Ошибка отправки: ' + msg;
                return;
            }

            // успех
            otpTarget.textContent = fullPhone;
            stepPhone.style.display = 'none';
            stepOtp.style.display = 'block';
            authOtp.focus();
            authMessageMain.textContent = '';
            authMessageOtp.textContent = 'Код отправлен.';
            startResendTimer(60);
        } catch (e) {
            sendOtpBtn.disabled = false;
            console.error('sendOtp error', e);
            authMessageMain.textContent = 'Сервис временно недоступен. Попробуйте позже или войдите через Google.';
        }
    });

    // Повторная отправка (resend) — аналогично с обработкой ошибок
    resendOtpBtn.addEventListener('click', async () => {
        resendOtpBtn.disabled = true;
        authMessageOtp.textContent = 'Повторная отправка...';
        const fullPhone = buildPhoneE164();
        try {
            const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
            if (error) {
                const msg = (error.message || '').toString();
                if (/unsupported phone provider|Unsupported phone provider/i.test(msg) || /provider/i.test(msg)) {
                    authMessageOtp.textContent = 'Невозможно отправить SMS для этого номера. Попробуйте Google или другой номер.';
                    googleBtn.focus();
                    return;
                }
                authMessageOtp.textContent = 'Ошибка отправки: ' + msg;
                return;
            }
            authMessageOtp.textContent = 'Код отправлен повторно.';
            startResendTimer(60);
        } catch (e) {
            console.error('resend error', e);
            authMessageOtp.textContent = 'Ошибка связи. Попробуйте позже.';
        } finally {
            // если таймер не запущен — убедимся, что кнопка снова разблокируется корректно через UI
            updateResendUI();
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
            options: { redirectTo: window.location.origin + '/in-check.html' }
        });
    });
} else {
    // If no auth modal on the page, ensure nav "Вход" links to in-check page (static fallback)
    const navLoginLink = document.querySelector('.nav-actions .btn-login');
    if (navLoginLink && navLoginLink.tagName.toLowerCase() === 'a') {
        // leave as link to in-check.html
    } else if (navLoginLink) {
        // convert button to link fallback
        navLoginLink.addEventListener('click', () => { window.location.href = 'in-check.html'; });
    }
}

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

// buildPhoneE164 использует очищённые цифры, поэтому оставляем её без изменений
