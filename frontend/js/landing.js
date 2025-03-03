document.addEventListener('DOMContentLoaded', function() {
    // Navigation buttons in the header
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    // CTA buttons
    const getStartedBtn = document.getElementById('getStartedBtn');
    const signInBtn = document.getElementById('signInBtn');

    // Add event listeners
    loginBtn?.addEventListener('click', () => navigateTo('login.html'));
    registerBtn?.addEventListener('click', () => navigateTo('register.html'));
    getStartedBtn?.addEventListener('click', () => navigateTo('register.html'));
    signInBtn?.addEventListener('click', () => navigateTo('login.html'));

    // Footer links
    document.querySelectorAll('.footer-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const path = this.getAttribute('href');
            navigateTo(path + '.html');
        });
    });

    function navigateTo(path) {
        if (typeof router !== 'undefined') {
            router.navigate(path);
        } else {
            console.error('Router is not initialized');
            // Fallback to direct navigation
            window.location.href = path;
        }
    }
}); 