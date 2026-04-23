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