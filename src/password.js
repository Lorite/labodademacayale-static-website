// Simple password protection
// Note: This is for basic guest access only. For production, consider server-side authentication.

const PASSWORD = 'changeme'; // Change this to your desired password

function checkPassword() {
    const input = document.getElementById('password-input');
    const errorMsg = document.getElementById('error-message');

    if (input.value === PASSWORD) {
        // Store in session storage (cleared when browser closes)
        sessionStorage.setItem('wedding_authenticated', 'true');
        showMainContent();
    } else {
        errorMsg.textContent = 'Incorrect password. Try again.';
        input.value = '';
        input.focus();
    }
}

function showMainContent() {
    document.getElementById('password-screen').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
}

function checkAuthentication() {
    if (sessionStorage.getItem('wedding_authenticated') === 'true') {
        showMainContent();
    }
}

// Allow Enter key to submit password
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();

    const passwordInput = document.getElementById('password-input');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                checkPassword();
            }
        });
        passwordInput.focus();
    }
});
