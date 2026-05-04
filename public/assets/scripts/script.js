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
const displayImg = document.querySelector('.memoji-display');
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