const loaderBtn = document.querySelector('.loader');
const allOptions = document.querySelectorAll('.options-container button');
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

// Memoji handler i make sure the event prevent default so the user does not have to refresh for the new pfp to show up
const memojiForm = document.getElementById('memojiForm');
const displayImg = document.querySelector('.memoji');
const popover = document.getElementById('profiselector');


// Handle Memoji Form Submission
if (memojiForm) {
    memojiForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitter = e.submitter || document.activeElement;
        const memojiId = submitter.value;
        const imgInside = submitter.querySelector('img');

        if (!memojiId) return memojiForm.submit();

        // UI Loading State
        submitter.classList.add('is-loading');
        if (displayImg) displayImg.style.opacity = '0.5';

        try {
            const response = await fetch(memojiForm.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ memojiId })
            });

            if (!response.ok) throw new Error();

            // Update UI on Success
            if (imgInside && displayImg) {
                const newBaseUrl = imgInside.src.split('?')[0];
                const picture = displayImg.closest('picture');
                const cacheBuster = `v=${Date.now()}`;

                if (picture) {
                    picture.querySelectorAll('source').forEach(source => {
                        const format = source.type.split('/')[1] || 'webp';
                        source.srcset = `${newBaseUrl}?width=150&height=150&format=${format}&quality=70&${cacheBuster}`;
                    });
                    displayImg.src = `${newBaseUrl}?width=150&height=150&quality=60&${cacheBuster}`;
                } else {
                    displayImg.src = `${imgInside.src}&${cacheBuster}`;
                }
            }
            
            // Close Popover
            popover?.hidePopover ? popover.hidePopover() : (popover.style.display = 'none');

        } catch (err) {
            memojiForm.submit(); // Fallback to full reload on error
        } finally {
            submitter.classList.remove('is-loading');
            if (displayImg) displayImg.style.opacity = '1';
        }
    });
}


// color picker user can pick their own accent color BUT it has to have enough contrast based on their system settings color. WOW thats coool

const colorPicker = document.querySelector('#accentColor');
const warning = document.querySelector('#contrastWarning');

// Check if there is a saved color in user directus
const savedColor = localStorage.getItem('userAccentColor');
if (savedColor) {
    colorPicker.value = savedColor;
    applyColor(savedColor);
}

// Calculate the contrast
function getLuminance(hex) {
    const rgb = hex.match(/[A-Za-z0-9]{2}/g).map(v => {
        let val = parseInt(v, 16) / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function applyColor(color) {
    const luminance = getLuminance(color);
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Contrast Logic
    const isLowContrast = isDarkMode ? luminance < 0.2 : luminance > 0.7;

    if (isLowContrast) {
        warning.style.display = 'block';
    } else {
        warning.style.display = 'none';
        // Apply globally to CSS variable
        document.documentElement.style.setProperty('--accent-color', color);
        // Save to Local Storage instead of Directus
        localStorage.setItem('userAccentColor', color);
    }
}

// Listen for picker changes
colorPicker.addEventListener('input', (e) => {
    applyColor(e.target.value);
});

// Re-check if the user toggles System Dark Mode
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    applyColor(colorPicker.value);
});