/**
 * UI & Animation Logic
 */
const loaderBtn = document.querySelector('.loader');
const allOptions = document.querySelectorAll('.options-container button');

const triggerAnimation = (event) => {
    const clickedBtn = event.currentTarget;
    const targetUrl = clickedBtn.getAttribute('data-url');
    
    if (loaderBtn) {
        loaderBtn.setAttribute('href', targetUrl);
        loaderBtn.classList.remove('shownow', 'ready');
        void loaderBtn.offsetWidth; // Reflow to restart animation
        loaderBtn.classList.add('shownow');
    }
};

allOptions.forEach(btn => {
    btn.addEventListener('click', triggerAnimation);
});

/**
 * Color Picker & Contrast Logic
 */
const accentForm = document.getElementById('accentForm');
const colorPicker = document.querySelector('#accentColor');
const warning = document.querySelector('#contrastWarning');

// Helper: Calculate luminance for contrast checking
function getLuminance(hex) {
    const rgb = hex.match(/[A-Za-z0-9]{2}/g).map(v => {
        let val = parseInt(v, 16) / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/**
 * AJAX function to talk to your Directus PATCH route
 * Includes Loading, Success, and Error states
 */
async function syncColorToServer(color) {
    if (!accentForm) return;

    const wrapper = colorPicker.closest('.color-picker-wrapper');
    if (wrapper) wrapper.classList.add('is-loading');

    try {
        const response = await fetch(accentForm.action, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accentColor: color }) // Sent as JSON
        });
        
        if (response.ok) {
            if (wrapper) {
                wrapper.classList.remove('is-loading');
                wrapper.classList.add('is-success');
                setTimeout(() => wrapper.classList.remove('is-success'), 2500);
            }
        } else {
            throw new Error("Patch failed");
        }
    } catch (err) {
        console.error("❌ Patch Error:", err);
        if (wrapper) wrapper.classList.add('is-error');
    } finally {
        if (wrapper) wrapper.classList.remove('is-loading');
    }
}

// Main logic to apply colors locally (Optimistic UI)
function applyColor(color, shouldSync = true) {
    if (!colorPicker) return;

    const luminance = getLuminance(color);
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Low contrast check
    const isLowContrast = isDarkMode ? luminance < 0.2 : luminance > 0.7;

    if (isLowContrast) {
        if (warning) warning.style.display = 'block';
    } else {
        if (warning) warning.style.display = 'none';
        
        // Update CSS and LocalStorage immediately for instant feedback
        document.documentElement.style.setProperty('--accent-color', color);
        localStorage.setItem('userAccentColor', color);

        if (shouldSync) {
            syncColorToServer(color);
        }
    }
}

/**
 * Initialization & Event Listeners
 */
if (colorPicker) {
    // 1. Load saved color from LocalStorage on page load
    const savedColor = localStorage.getItem('userAccentColor');
    if (savedColor) {
        colorPicker.value = savedColor;
        applyColor(savedColor, false); 
    }

    // 2. Live preview (does not save to DB while dragging)
    colorPicker.addEventListener('input', (e) => {
        applyColor(e.target.value, false);
    });

    // 3. Final selection (saves to DB when user finishes picking)
    colorPicker.addEventListener('change', (e) => {
        // Prevent default form behavior if necessary
        e.preventDefault();
        applyColor(e.target.value, true);
    });
}

// Update contrast check if user toggles System Dark Mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (colorPicker) applyColor(colorPicker.value, false);
});