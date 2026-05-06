
const loaderBtn = document.querySelector('.loader');
const allOptions = document.querySelectorAll('.options-container button');
let timer;

const triggerAnimation = (event) => {

    const clickedBtn = event.currentTarget;

    const targetUrl = clickedBtn.getAttribute('data-url');
    loaderBtn.setAttribute('href', targetUrl);

    loaderBtn.classList.remove('shownow', 'ready');
    
    void loaderBtn.offsetWidth; 

    loaderBtn.classList.add('shownow');
};

allOptions.forEach(btn => {
    btn.addEventListener('click', triggerAnimation);
});

const memojiForm = document.getElementById('memojiForm');

if (memojiForm) {
    // We listen for clicks on the form and catch them at the button level
    memojiForm.addEventListener('click', async (event) => {
        const clickedBtn = event.target.closest('.memoji-choice-btn');
        if (!clickedBtn) return;

        // 1. Prevent standard form submission to allow for JS enhancement
        event.preventDefault();

        const memojiId = clickedBtn.value;
        const targetUrl = memojiForm.action;

        // 2. Start animation logic
        if (loaderBtn) {
            loaderBtn.classList.remove('shownow', 'ready');
            void loaderBtn.offsetWidth; // Reflow to restart animation
            loaderBtn.classList.add('shownow');
        }

        try {
            // 3. Perform the PATCH via fetch
            const response = await fetch(targetUrl, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' // Crucial for the backend logic check
                },
                body: JSON.stringify({ memojiId: memojiId }),
            });

            if (response.ok) {
                // 4. Redirect manually to refresh the UI with new data
                window.location.href = '/account'; 
            } else {
                throw new Error("Patch failed");
            }
        } catch (error) {
            console.error("Fetch error, falling back to standard form submission:", error);
            // Fallback: If fetch fails, submit the form normally (Progressive Enhancement)
            memojiForm.submit();
        }
    });
}

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
 * AJAX function for Color Picker
 */
async function syncColorToServer(color) {
    if (!accentForm) return;

    const wrapper = colorPicker.closest('.color-picker-wrapper');
    if (wrapper) wrapper.classList.add('is-loading');

    try {
        const response = await fetch(accentForm.action, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ accentColor: color }) 
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
    
    const isLowContrast = isDarkMode ? luminance < 0.2 : luminance > 0.7;

    if (isLowContrast) {
        if (warning) warning.style.display = 'block';
    } else {
        if (warning) warning.style.display = 'none';
        
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
    const savedColor = localStorage.getItem('userAccentColor');
    if (savedColor) {
        colorPicker.value = savedColor;
        applyColor(savedColor, false); 
    }

    colorPicker.addEventListener('input', (e) => {
        applyColor(e.target.value, false);
    });

    colorPicker.addEventListener('change', (e) => {
        e.preventDefault();
        applyColor(e.target.value, true);
    });
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (colorPicker) applyColor(colorPicker.value, false);
});