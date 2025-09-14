// Data for the hero section with images
const heroContent = [
    {
        title: 'Распознавание чистоты авто',
        subtitle: 'inCheck может определять, насколько чист автомобиль, всего по одной фотографии.',
        image: 'https://images.unsplash.com/photo-1577935515320-b0ef9892c179?w=1600&q=80&auto=format&fit=crop'
    },
    {
        title: 'Определение повреждений',
        subtitle: 'С помощью inCheck вы можете обнаружить повреждения на кузове автомобиля.',
        image: 'https://images.unsplash.com/photo-1610486847814-c081308a09f3?w=1600&q=80&auto=format&fit=crop'
    },
    {
        title: 'Защита вашего комфорта',
        subtitle: 'Наш сервис помогает обеспечить безопасность и комфорт во время поездок.',
        image: 'https://images.unsplash.com/photo-1627471207914-f481a546d140?w=1600&q=80&auto=format&fit=crop'
    },
];

let heroIndex = 0;
const heroTitleEl = document.getElementById('hero-title');
const heroSubtitleEl = document.getElementById('hero-subtitle');
const heroBgEl = document.getElementById('hero-bg');
const heroIndicatorBar = document.getElementById('hero-indicator-bar');
const nav = document.getElementById('navbar');

// Function to update the hero section content and image
function updateHeroContent() {
    if (heroTitleEl && heroSubtitleEl && heroBgEl) {
        const { title, subtitle, image } = heroContent[heroIndex];
        heroTitleEl.textContent = title;
        heroSubtitleEl.textContent = subtitle;
        heroBgEl.style.backgroundImage = `url(${image})`;

        heroIndex = (heroIndex + 1) % heroContent.length;
        resetIndicator();
    }
}

// Logic for the hero section indicator
function resetIndicator() {
    if (heroIndicatorBar) {
        heroIndicatorBar.style.transition = 'none';
        heroIndicatorBar.style.width = '0%';
        setTimeout(() => {
            heroIndicatorBar.style.transition = 'width 5s linear';
            heroIndicatorBar.style.width = '100%';
        }, 50);
    }
}

// Update the content every 5 seconds
if (heroTitleEl) {
    setInterval(updateHeroContent, 5000);
}

// Initialize the hero content on page load
document.addEventListener('DOMContentLoaded', () => {
    if (heroTitleEl) {
        updateHeroContent();
    }
});

// Logic for the sticky navbar
if (nav) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}

// Photo upload logic for in-check.html
const photoInput = document.getElementById('photo-input');
const preview = document.getElementById('preview');
const result = document.getElementById('result');
const dropZone = document.getElementById('drop-zone');
const clearBtn = document.getElementById('clear-btn');
const spinner = document.getElementById('spinner');

const MAX_SIZE_MB = 5;

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
        if (clearBtn) {
            clearBtn.style.display = 'none';
        }
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
