/* Pruned & DRY Color Picker Logic with Strict Contrast Blocking */

const accentForm = document.getElementById('accentForm');
const accentInput = document.getElementById('accentColor'); 
const modeToggleBtn = document.getElementById('mode-toggle');
const swatchesContainer = document.querySelector('.default-swatches');
const colorPopover = document.getElementById('colorpicker');
const contrastWarning = document.getElementById('contrastWarning'); 

const spectrumCanvas = document.getElementById('spectrum-canvas');
const spectrumCtx = spectrumCanvas.getContext('2d');
const spectrumCursor = document.getElementById('spectrum-cursor'); 

const hueCanvas = document.getElementById('hue-canvas');
const hueCtx = hueCanvas.getContext('2d');
const hueCursor = document.getElementById('hue-cursor'); 

const rgbFields = document.getElementById('rgb-fields');
const hexField = document.getElementById('hex-field');
const redIn = document.getElementById('red');
const greenIn = document.getElementById('green');
const blueIn = document.getElementById('blue');
const hexIn = document.getElementById('hex');

let spectrumRect, hueRect;
let currentColor = '';
let hue = 0;
let saturation = 1;
let lightness = 0.5;

function ColorPicker() {
    this.setupCanvas();
    this.addDefaultSwatches();
    this.initColor();
}

ColorPicker.prototype.setupCanvas = function() {
    if (spectrumCanvas.offsetWidth > 0) {
        spectrumCanvas.width = spectrumCanvas.offsetWidth;
        spectrumCanvas.height = spectrumCanvas.offsetHeight;
        hueCanvas.width = hueCanvas.offsetWidth;
        hueCanvas.height = hueCanvas.offsetHeight;
    }
    refreshElementRects();
    createHueSpectrum();
};

ColorPicker.prototype.initColor = function() {
    const savedColor = localStorage.getItem('userAccentColor') || '#34a853';
    colorToPos(savedColor);
    applyColor(tinycolor(savedColor), false);
};

ColorPicker.prototype.defaultSwatches = [
    '#FFFFFF', '#FFFB0D', '#0532FF', '#FF9300', '#00F91A', '#FF2700', 
    '#000000', '#686868', '#EE5464', '#D27AEE', '#5BA8C4', '#E64AA9'
];

ColorPicker.prototype.addDefaultSwatches = function() {
    swatchesContainer.innerHTML = '';
    this.defaultSwatches.forEach(color => createSwatch(swatchesContainer, color));
};

function getLuminance(hex) {
    const rgb = hex.match(/[A-Za-z0-9]{2}/g).map(v => {
        let val = parseInt(v, 16) / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

async function syncColorToServer(color) {
    if (!accentForm) return;
    try {
        const response = await fetch(accentForm.action, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ accentColor: color }) 
        });
    } catch (err) {
        console.error("❌ Sync Error:", err);
    }
}

function updateUI(hexColor, colorObj) {
    document.documentElement.style.setProperty('--accent-color', hexColor);
    localStorage.setItem('userAccentColor', hexColor);
    accentInput.value = hexColor;

    currentColor = colorObj;
    spectrumCursor.style.backgroundColor = hexColor;
    hueCursor.style.backgroundColor = `hsl(${colorObj.toHsl().h}, 100%, 50%)`;
    
    const rgb = colorObj.toRgb();
    redIn.value = rgb.r; greenIn.value = rgb.g; blueIn.value = rgb.b;
    hexIn.value = colorObj.toHex();
}

function applyColor(colorObj, shouldSync = true) {
    const hexColor = colorObj.toHexString();
    const luminance = getLuminance(hexColor);
    
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isLowContrast = isDarkMode ? luminance < 0.2 : luminance > 0.7;

    // Toggle the warning text
    if (contrastWarning) {
        contrastWarning.style.display = isLowContrast ? 'block' : 'none';
    }

    // BLOCKER: If contrast is bad, stop here. Do not update UI or Sync.
    if (isLowContrast) return;

    updateUI(hexColor, colorObj);

    if (shouldSync) {
        syncColorToServer(hexColor);
    }
}

function createShadeSpectrum(color) {
    spectrumCtx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
    spectrumCtx.fillStyle = color || '#f00';
    spectrumCtx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

    const whiteGrad = spectrumCtx.createLinearGradient(0, 0, spectrumCanvas.width, 0);
    whiteGrad.addColorStop(0, "#fff");
    whiteGrad.addColorStop(1, "transparent");
    spectrumCtx.fillStyle = whiteGrad;
    spectrumCtx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

    const blackGrad = spectrumCtx.createLinearGradient(0, 0, 0, spectrumCanvas.height);
    blackGrad.addColorStop(0, "transparent");
    blackGrad.addColorStop(1, "#000");
    spectrumCtx.fillStyle = blackGrad;
    spectrumCtx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
}

function createHueSpectrum() {
    const hueGrad = hueCtx.createLinearGradient(0, 0, 0, hueCanvas.height);
    const stops = [0, 0.17, 0.33, 0.5, 0.67, 0.83, 1];
    const hues = [0, 298.8, 241.2, 180, 118.8, 61.2, 360];
    stops.forEach((stop, i) => hueGrad.addColorStop(stop, `hsl(${hues[i]}, 100%, 50%)`));
    hueCtx.fillStyle = hueGrad;
    hueCtx.fillRect(0, 0, hueCanvas.width, hueCanvas.height);
}

function refreshElementRects() {
    spectrumRect = spectrumCanvas.getBoundingClientRect();
    hueRect = hueCanvas.getBoundingClientRect();
}

function colorToPos(color) {
    const c = tinycolor(color);
    const hsv = c.toHsv();
    hue = hsv.h;
    saturation = hsv.s;

    refreshElementRects();
    spectrumCursor.style.left = (spectrumRect.width * hsv.s) + 'px';
    spectrumCursor.style.top = (spectrumRect.height * (1 - hsv.v)) + 'px';
    hueCursor.style.top = (hueRect.height - ((hue / 360) * hueRect.height)) + 'px';
    
    createShadeSpectrum(tinycolor(`hsl ${hue} 1 .5`).toHslString());
}

function getPointerCoords(e, rect) {
    const pageX = e.pageX || (e.touches ? e.touches[0].pageX : 0);
    const pageY = e.pageY || (e.touches ? e.touches[0].pageY : 0);
    return {
        x: Math.max(0, Math.min(pageX - rect.left - window.scrollX, rect.width)),
        y: Math.max(0, Math.min(pageY - rect.top - window.scrollY, rect.height))
    };
}

function getSpectrumColor(e) {
    e.preventDefault();
    const coords = getPointerCoords(e, spectrumRect);
    // Cursor position should still update so user knows where they are dragging
    spectrumCursor.style.left = coords.x + 'px';
    spectrumCursor.style.top = coords.y + 'px';

    const s = coords.x / spectrumRect.width;
    const v = 1 - (coords.y / spectrumRect.height);
    applyColor(tinycolor({ h: hue, s: s, v: v }), false);
}

function getHueColor(e) {
    e.preventDefault();
    const coords = getPointerCoords(e, hueRect);
    hueCursor.style.top = coords.y + 'px';

    hue = 360 - (360 * (coords.y / hueRect.height));
    createShadeSpectrum(tinycolor(`hsl ${hue} 1 .5`).toHslString());
    applyColor(tinycolor({ h: hue, s: saturation, v: 1 }), false);
}

const endInteraction = () => {
    window.removeEventListener('mousemove', getSpectrumColor);
    window.removeEventListener('mousemove', getHueColor);
    window.removeEventListener('mouseup', endInteraction);
    // On release, if the color was blocked, currentColor remains the last valid hex
    applyColor(currentColor, true);
};

spectrumCanvas.addEventListener('mousedown', (e) => {
    refreshElementRects();
    getSpectrumColor(e);
    window.addEventListener('mousemove', getSpectrumColor);
    window.addEventListener('mouseup', endInteraction);
});

hueCanvas.addEventListener('mousedown', (e) => {
    refreshElementRects();
    getHueColor(e);
    window.addEventListener('mousemove', getHueColor);
    window.addEventListener('mouseup', endInteraction);
});

function createSwatch(target, color) {
    const swatch = document.createElement('button');
    swatch.type = "button";
    swatch.className = 'swatch';
    swatch.style.backgroundColor = color;
    swatch.addEventListener('click', () => {
        const c = tinycolor(color);
        colorToPos(c);
        applyColor(c, true);
    });
    target.appendChild(swatch);
}

[redIn, greenIn, blueIn].forEach(el => {
    el.addEventListener('input', () => {
        const c = tinycolor({ r: redIn.value, g: greenIn.value, b: blueIn.value });
        if (c.isValid()) { colorToPos(c); applyColor(c, true); }
    });
});

hexIn.addEventListener('input', () => {
    const c = tinycolor(hexIn.value);
    if (c.isValid()) { colorToPos(c); applyColor(c, true); }
});

modeToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    [rgbFields, hexField].forEach(el => el.classList.toggle('active'));
});

if (colorPopover) {
    colorPopover.addEventListener('toggle', (e) => {
        if (e.newState === 'open') requestAnimationFrame(() => new ColorPicker());
    });
}

new ColorPicker();