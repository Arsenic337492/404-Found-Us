const photoInput = document.getElementById('photo-input');
const preview = document.getElementById('preview');
const result = document.getElementById('result');
const dropZone = document.getElementById('drop-zone');
const clearBtn = document.getElementById('clear-btn');
const spinner = document.getElementById('spinner');

const MAX_SIZE_MB = 5;

// Data for the hero section
const heroContent = [
    {
        title: 'Распознавание чистоты авто',
        subtitle: 'inCheck может определять, насколько чист автомобиль, всего по одной фотографии.',
    },
    {
        title: 'Определение повреждений',
        subtitle: 'С помощью inCheck вы можете обнаружить повреждения на кузове автомобиля.',
    },
    {
        title: 'Защита вашего комфорта',
        subtitle: 'Наш сервис помогает обеспечить безопасность и комфорт во время поездок.',
    },
];

let heroIndex = 0;
const heroTitleEl = document.getElementById('hero-title');
const heroSubtitleEl = document.getElementById('hero-subtitle');

// Function to update the hero section content
function updateHeroContent() {
    if (heroTitleEl && heroSubtitleEl) {
        const { title, subtitle } = heroContent[heroIndex];
        heroTitleEl.textContent = title;
        heroSubtitleEl.textContent = subtitle;
        heroIndex = (heroIndex + 1) % heroContent.length;
    }
}

// Update the content every 5 seconds
setInterval(updateHeroContent, 5000);

// Initialize the hero content on page load
document.addEventListener('DOMContentLoaded', updateHeroContent);

// Logic for the sticky navbar
const nav = document.getElementById('navbar');
if (nav) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

function showSpinner(show) {
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
}

function validateFile(file) {
    if (!file.type.startsWith('image/')) {
        if (result) {
            result.textContent = 'Ошибка: можно загружать только изображения.';
        }
        return false;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        if (result) {
            result.textContent = `Ошибка: максимальный размер файла — ${MAX_SIZE_MB} МБ.`;
        }
        return false;
    }
    return true;
}

function showPreview(file) {
    if (preview) {
        preview.innerHTML = '';
    }
    if (result) {
        result.textContent = '';
    }
    if (!validateFile(file)) return;
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.onload = () => URL.revokeObjectURL(img.src);
    if (preview) {
        preview.appendChild(img);
    }
    if (clearBtn) {
        clearBtn.style.display = 'inline-block';
    }
}

if (photoInput) {
    photoInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) showPreview(file);
    });
}

if (clearBtn) {
    clearBtn.addEventListener('click', function() {
        if (photoInput) {
            photoInput.value = '';
        }
        if (preview) {
            preview.innerHTML = '';
        }
        if (result) {
            result.textContent = '';
        }
        clearBtn.style.display = 'none';
    });
}

if (dropZone) {
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
            if (photoInput) {
                photoInput.value = '';
            }
            showPreview(file);
        }
    });

    dropZone.addEventListener('mouseenter', () => {
        dropZone.title = 'Перетащите изображение или выберите файл выше';
    });
    dropZone.addEventListener('mouseleave', () => {
        dropZone.title = 'Перетащите изображение сюда';
    });
}
