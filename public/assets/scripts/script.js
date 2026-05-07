/* 
    GENERAL UI & NAVIGATION LOGIC 
*/

const loaderBtn = document.querySelector('.loader');
const allOptions = document.querySelectorAll('.options-container button');

/**
 * Trigger Global Loader Animation
 */
const triggerAnimation = (event) => {
    const clickedBtn = event.currentTarget;
    const targetUrl = clickedBtn.getAttribute('data-url');
    
    if (loaderBtn) {
        loaderBtn.setAttribute('href', targetUrl);
        loaderBtn.classList.remove('shownow', 'ready');
        void loaderBtn.offsetWidth; // Force reflow
        loaderBtn.classList.add('shownow');
    }
};

allOptions.forEach(btn => {
    btn.addEventListener('click', triggerAnimation);
});

/**
 * Memoji Selection & Async Form Patching
 */
const memojiForm = document.getElementById('memojiForm');

if (memojiForm) {
    memojiForm.addEventListener('click', async (event) => {
        const clickedBtn = event.target.closest('.memoji-choice-btn');
        if (!clickedBtn) return;

        event.preventDefault();

        const memojiId = clickedBtn.value;
        const targetUrl = memojiForm.action;

        // Start Loader
        if (loaderBtn) {
            loaderBtn.classList.remove('shownow', 'ready');
            void loaderBtn.offsetWidth; 
            loaderBtn.classList.add('shownow');
        }

        try {
            const response = await fetch(targetUrl, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' 
                },
                body: JSON.stringify({ memojiId: memojiId }),
            });

            if (response.ok) {
                window.location.href = '/account'; 
            } else {
                throw new Error("Patch failed");
            }
        } catch (error) {
            console.error("Fetch error, falling back:", error);
            memojiForm.submit(); // Progressive Enhancement
        }
    });
}