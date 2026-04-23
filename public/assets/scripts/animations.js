document.addEventListener("DOMContentLoaded", () => {
    // 1. Check for persistent notifications immediately
    initNotificationLogic();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const urlParams = new URLSearchParams(window.location.search);
    const isCorrect = urlParams.get('step') === 'correct' && !urlParams.get('step')?.includes('incorrect');
    const leafCanvas = document.getElementById("leafCanvas");
    const collectForm = document.querySelector('.collectbutton');

    if (isCorrect || leafCanvas || collectForm) {
        gsap.registerPlugin(MotionPathPlugin);
    }

    if (collectForm) initCollectAnimation(collectForm);
    if (isCorrect) initConfetti();
    if (leafCanvas) initLeafFalling(leafCanvas);
});

/**
 * Persists the "New Item" state across page reloads
 */
const setCollectionNotification = () => {
    const footerLinks = document.querySelectorAll('.main-footer ul li a');
    const lastLink = footerLinks[footerLinks.length - 1];
    
    if (lastLink) {
        localStorage.setItem('collectionNotification', 'true');
        lastLink.classList.add('has-new');
    }
};

/**
 * Initializes the dot on page load and handles cleanup on click
 */
const initNotificationLogic = () => {
    const footerLinks = document.querySelectorAll('.main-footer ul li a');
    const lastLink = footerLinks[footerLinks.length - 1];

    if (!lastLink) return;

    if (localStorage.getItem('collectionNotification') === 'true') {
        lastLink.classList.add('has-new');
    }

    lastLink.addEventListener('click', () => {
        lastLink.classList.remove('has-new');
        localStorage.removeItem('collectionNotification');
    });
};

/**
 * Core Animation Logic
 */
function initCollectAnimation(form) {
    const animatedPlant = document.querySelector('.plant-animated');
    const sourceImage = document.querySelector('.result.success figure img');
    const plantIcon = document.querySelector('.collection-icon');

    if (!animatedPlant || !sourceImage || !plantIcon) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const startRect = sourceImage.getBoundingClientRect();
        const iconRect = plantIcon.getBoundingClientRect();
        const targetX = iconRect.left + (iconRect.width / 2) - (startRect.width / 2);
        const targetY = iconRect.top + (iconRect.height / 2) - (startRect.height / 2);

        gsap.set(animatedPlant, { 
            display: "block", 
            position: "fixed", 
            top: 0, left: 0,
            x: startRect.left, y: startRect.top, 
            width: startRect.width, height: startRect.height,
            opacity: 1, scale: 1, visibility: "visible", borderRadius: "50%" 
        });

        gsap.to(animatedPlant, {
            duration: 1.2, 
            opacity: 0.5, scale: 0.1, rotation: 720,
            ease: "power2.inOut",
            motionPath: {
                path: [{ x: startRect.left - 100, y: startRect.top - 50 }, { x: targetX, y: targetY }],
                curviness: 2
            },
            onComplete: () => {
                // Success pop on the navigation icon
                gsap.to(plantIcon, {
                    scale: 1.5, duration: 0.2, yoyo: true, repeat: 1, ease: "back.out(1.7)",
                    onComplete: () => {
                        // Mark as new in storage BEFORE submitting
                        setCollectionNotification();
                        // Small delay to ensure the browser writes to localStorage
                        setTimeout(() => form.submit(), 300); 
                    }
                });
            }
        });
    });
}

/**
 * Visual Effects (Falling Leaves & Confetti)
 */
function initLeafFalling(canvas) {
    const ctx = canvas.getContext("2d");
    const leafImg = new Image();
    leafImg.src = "/assets/images/leaf.webp"; 
    let width, height, leaves = [];
    const resize = () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize, { passive: true });
    resize();
    leafImg.onload = () => {
        for (let i = 0; i < 40; i++) {
            const leaf = { x: Math.random() * width, y: Math.random() * -height, rotation: Math.random() * 360, scale: gsap.utils.random(0.4, 1), opacity: gsap.utils.random(0.3, 0.8), sideSway: Math.random() * 100 };
            gsap.to(leaf, { y: height + 100, duration: gsap.utils.random(4, 8), repeat: -1, ease: "none", delay: gsap.utils.random(0, 0.5) });
            gsap.to(leaf, { sideSway: "+=50", rotation: "+=180", duration: gsap.utils.random(2, 4), repeat: -1, yoyo: true, ease: "sine.inOut" });
            leaves.push(leaf);
        }
        gsap.ticker.add(() => {
            ctx.clearRect(0, 0, width, height);
            leaves.forEach(leaf => {
                ctx.save();
                ctx.globalAlpha = leaf.opacity;
                ctx.translate(leaf.x + leaf.sideSway, leaf.y);
                ctx.rotate(leaf.rotation * Math.PI / 180);
                ctx.scale(leaf.scale, leaf.scale);
                ctx.drawImage(leafImg, -20, -20, 40, 40);
                ctx.restore();
            });
        });
    };
}

function initConfetti() {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, particleCount, origin: { x: Math.random() * 0.2 + 0.1, y: Math.random() - 0.2 } });
        confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 0, particleCount, origin: { x: Math.random() * 0.2 + 0.7, y: Math.random() - 0.2 } });
    }, 250);
}