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
