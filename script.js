document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    menuToggle.addEventListener('click', function() {
        document.body.classList.toggle('nav-open');
    });
});


