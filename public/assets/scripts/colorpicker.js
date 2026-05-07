

// Get all ui stuff out of the account.liquid
const accentForm = document.getElementById('accentForm');
const accentInput = document.getElementById('accentColor'); 
const addSwatch = document.getElementById('add-swatch');
const modeToggle = document.getElementById('mode-toggle');
const swatchesContainer = document.querySelector('.default-swatches');
const userSwatches = document.getElementById('user-swatches');
const colorIndicator = document.getElementById('color-indicator');
const warning = document.getElementById('contrastWarning');

// Canvas Elements
const spectrumCanvas = document.getElementById('spectrum-canvas');
const spectrumCtx = spectrumCanvas.getContext('2d');
const spectrumCursor = document.getElementById('spectrum-cursor'); 

const hueCanvas = document.getElementById('hue-canvas');
const hueCtx = hueCanvas.getContext('2d');
const hueCursor = document.getElementById('hue-cursor'); 

// Input Fields
const rgbFields = document.getElementById('rgb-fields');
const hexField = document.getElementById('hex-field');
const redIn = document.getElementById('red');
const greenIn = document.getElementById('green');
const blueIn = document.getElementById('blue');
const hexIn = document.getElementById('hex');

// Global States
let spectrumRect, hueRect;
let currentColor = '';
let hue = 0;
let saturation = 1;
let lightness = 0.5;

// init the color pixker
function ColorPicker() {
    spectrumCanvas.width = spectrumCanvas.offsetWidth;
    spectrumCanvas.height = spectrumCanvas.offsetHeight;
    hueCanvas.width = hueCanvas.offsetWidth;
    hueCanvas.height = hueCanvas.offsetHeight;

    this.addDefaultSwatches();
    createHueSpectrum();
    refreshElementRects();

    // Check for saved color in LocalStorage or default
    const savedColor = localStorage.getItem('userAccentColor') || '#34a853';
    colorToPos(savedColor);
    applyColor(tinycolor(savedColor), false);
}

// pre set colors
ColorPicker.prototype.defaultSwatches = [
    '#FFFFFF', '#FFFB0D', '#0532FF', '#FF9300', '#00F91A', '#FF2700', 
    '#000000', '#686868', '#EE5464', '#D27AEE', '#5BA8C4', '#E64AA9'
];

// sync with the db
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
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ accentColor: color }) 
        });
        if (response.ok) console.log("✅ Database updated:", color);
    } catch (err) {
        console.error("❌ Patch Error:", err);
    }
}

function applyColor(colorObj, shouldSync = true) {
    const hexColor = colorObj.toHexString();
    const luminance = getLuminance(hexColor);
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Your contrast thresholds
    const isLowContrast = isDarkMode ? luminance < 0.2 : luminance > 0.7;

    if (isLowContrast) {
        if (warning) warning.style.display = 'block';
    } else {
        if (warning) warning.style.display = 'none';

        document.documentElement.style.setProperty('--accent-color', hexColor);
        localStorage.setItem('userAccentColor', hexColor);

        accentInput.value = hexColor;

        if (shouldSync) syncColorToServer(hexColor);
    }

    // user feedback
    currentColor = colorObj;
    colorIndicator.style.backgroundColor = hexColor;
    spectrumCursor.style.backgroundColor = hexColor;
    hueCursor.style.backgroundColor = `hsl(${colorObj.toHsl().h}, 100%, 50%)`;
    
    // Update text inputs
    const rgb = colorObj.toRgb();
    redIn.value = rgb.r; greenIn.value = rgb.g; blueIn.value = rgb.b;
    hexIn.value = colorObj.toHex();
}

// canvas for the full spectrum
function createShadeSpectrum(color) {
    const ctx = spectrumCtx;
    ctx.clearRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

    ctx.fillStyle = color || '#f00';
    ctx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

    const whiteGrad = ctx.createLinearGradient(0, 0, spectrumCanvas.width, 0);
    whiteGrad.addColorStop(0, "#fff");
    whiteGrad.addColorStop(1, "transparent");
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

    const blackGrad = ctx.createLinearGradient(0, 0, 0, spectrumCanvas.height);
    blackGrad.addColorStop(0, "transparent");
    blackGrad.addColorStop(1, "#000");
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
}

function createHueSpectrum() {
    const ctx = hueCtx;
    const hueGrad = ctx.createLinearGradient(0, 0, 0, hueCanvas.height);
    hueGrad.addColorStop(0.00, "hsl(0,100%,50%)");
    hueGrad.addColorStop(0.17, "hsl(298.8, 100%, 50%)");
    hueGrad.addColorStop(0.33, "hsl(241.2, 100%, 50%)");
    hueGrad.addColorStop(0.50, "hsl(180, 100%, 50%)");
    hueGrad.addColorStop(0.67, "hsl(118.8, 100%, 50%)");
    hueGrad.addColorStop(0.83, "hsl(61.2,100%,50%)");
    hueGrad.addColorStop(1.00, "hsl(360,100%,50%)");
    ctx.fillStyle = hueGrad;
    ctx.fillRect(0, 0, hueCanvas.width, hueCanvas.height);
}

// refresh and color values
function refreshElementRects() {
    spectrumRect = spectrumCanvas.getBoundingClientRect();
    hueRect = hueCanvas.getBoundingClientRect();
}

function colorToPos(color) {
    const c = tinycolor(color);
    const hsl = c.toHsl();
    const hsv = c.toHsv();
    
    hue = hsl.h;
    saturation = hsv.s;
    lightness = c.toHsl().l;

    const x = spectrumRect.width * hsv.s;
    const y = spectrumRect.height * (1 - hsv.v);
    const hueY = hueRect.height - ((hue / 360) * hueRect.height);
    
    spectrumCursor.style.left = x + 'px';
    spectrumCursor.style.top = y + 'px';
    hueCursor.style.top = hueY + 'px';
    
    createShadeSpectrum(tinycolor('hsl ' + hue + ' 1 .5').toHslString());
}

// get user position on the canvas
function getSpectrumColor(e) {
    e.preventDefault();
    let x = (e.pageX || e.touches[0].pageX) - spectrumRect.left - window.scrollX;
    let y = (e.pageY || e.touches[0].pageY) - spectrumRect.top - window.scrollY;

    x = Math.max(0, Math.min(x, spectrumRect.width));
    y = Math.max(0, Math.min(y, spectrumRect.height));

    const s = x / spectrumRect.width;
    const v = 1 - (y / spectrumRect.height);
    
    const color = tinycolor({ h: hue, s: s, v: v });
    
    spectrumCursor.style.left = x + 'px';
    spectrumCursor.style.top = y + 'px';
    
    applyColor(color, false);
}

function getHueColor(e) {
    e.preventDefault();
    let y = (e.pageY || e.touches[0].pageY) - hueRect.top - window.scrollY;
    y = Math.max(0, Math.min(y, hueRect.height));

    hue = 360 - (360 * (y / hueRect.height));
    const color = tinycolor({ h: hue, s: saturation, v: lightness });
    
    createShadeSpectrum(tinycolor({ h: hue, s: 1, v: 1 }).toHslString());
    hueCursor.style.top = y + 'px';
    
    applyColor(color, false);
}

const endInteraction = () => {
    spectrumCursor.classList.remove('dragging');
    hueCursor.classList.remove('dragging');
    window.removeEventListener('mousemove', getSpectrumColor);
    window.removeEventListener('mousemove', getHueColor);
    window.removeEventListener('mouseup', endInteraction);
    
    applyColor(currentColor, true);
};

spectrumCanvas.addEventListener('mousedown', (e) => {
    refreshElementRects();
    getSpectrumColor(e);
    spectrumCursor.classList.add('dragging');
    window.addEventListener('mousemove', getSpectrumColor);
    window.addEventListener('mouseup', endInteraction);
});

hueCanvas.addEventListener('mousedown', (e) => {
    refreshElementRects();
    getHueColor(e);
    hueCursor.classList.add('dragging');
    window.addEventListener('mousemove', getHueColor);
    window.addEventListener('mouseup', endInteraction);
});

// add swatches
function createSwatch(target, color) {
    const swatch = document.createElement('button');
    swatch.type = "button";
    swatch.classList.add('swatch');
    swatch.style.backgroundColor = color;
    swatch.addEventListener('click', () => {
        const c = tinycolor(color);
        colorToPos(c);
        applyColor(c, true);
    });
    target.appendChild(swatch);
}

ColorPicker.prototype.addDefaultSwatches = function() {
    this.defaultSwatches.forEach(color => createSwatch(swatchesContainer, color));
};

[redIn, greenIn, blueIn].forEach(el => {
    el.addEventListener('input', () => {
        const c = tinycolor({ r: redIn.value, g: greenIn.value, b: blueIn.value });
        colorToPos(c);
        applyColor(c, true);
    });
});

hexIn.addEventListener('input', () => {
    const c = tinycolor(hexIn.value);
    if (c.isValid()) {
        colorToPos(c);
        applyColor(c, true);
    }
});

addSwatch.addEventListener('click', (e) => {
    e.preventDefault();
    createSwatch(userSwatches, currentColor.toHexString());
});

modeToggle.addEventListener('click', (e) => {
    e.preventDefault();
    rgbFields.classList.toggle('active');
    hexField.classList.toggle('active');
});

// sync on system theme change
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    applyColor(currentColor, false);
});

// Run                         
new ColorPicker();                 