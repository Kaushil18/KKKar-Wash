const API_URL = 'http://localhost:5000/api';

function isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
}

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function requireGuest() {
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');
    const btnText = document.getElementById('loginText');
    const spinner = document.getElementById('loginSpinner');
    
    btn.disabled = true;
    btnText.textContent = 'Logging in...';
    spinner.classList.remove('d-none');
    errorEl.classList.add('d-none');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user.role === 'admin') {
            window.location.href = 'admin/admin-dashboard.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('d-none');
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Login';
        spinner.classList.add('d-none');
    }
});

document.getElementById('registerForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('registerError');
    const btn = document.getElementById('registerBtn');
    const btnText = document.getElementById('registerText');
    const spinner = document.getElementById('registerSpinner');
    
    btn.disabled = true;
    btnText.textContent = 'Creating account...';
    spinner.classList.remove('d-none');
    errorEl.classList.add('d-none');
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, full_name: fullName, email, phone, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (data.errors && data.errors.length > 0) {
                throw new Error(data.errors[0].msg);
            }
            throw new Error(data.error || 'Registration failed');
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('d-none');
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Register';
        spinner.classList.add('d-none');
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

document.getElementById('togglePassword')?.addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const icon = this.querySelector('i');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        passwordInput.type = 'password';
        icon.className = 'bi bi-eye';
    }
});

function updateNavbarUser() {
    const user = getCurrentUser();
    if (user) {
        const nameElements = document.querySelectorAll('#userName, #userDisplayName');
        nameElements.forEach(el => {
            el.textContent = user.full_name || user.username;
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    if (user) {
        updateNavbarUser();
    }
});

if (window.location.pathname.includes('dashboard.html') || 
    window.location.pathname.includes('bookings.html') ||
    window.location.pathname.includes('services.html') ||
    window.location.pathname.includes('admin/')) {
    if (!requireAuth()) {}
}

if (window.location.pathname.includes('login.html') || 
    window.location.pathname.includes('register.html')) {
    requireGuest();
}