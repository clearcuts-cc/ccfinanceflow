/**
 * Authentication Logic for FinanceFlow
 */
const API_BASE = '/api/auth';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const errorDiv = document.getElementById('errorMessage');
    const submitBtn = document.querySelector('button[type="submit"]');

    function showError(msg) {
        if (errorDiv) {
            errorDiv.textContent = msg;
            errorDiv.style.display = 'block';
        } else {
            alert(msg);
        }
    }

    function setLoading(isLoading) {
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.textContent = isLoading ? 'Processing...' : (loginForm ? 'Login' : 'Sign Up');
        }
    }

    // LOGIN
    if (loginForm) {
        // Redirect if already logged in
        if (localStorage.getItem('token')) {
            window.location.href = 'index.html';
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setLoading(true);
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();

                if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'index.html';
                } else {
                    showError(data.error?.message || data.message || 'Login failed');
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                showError('Network error. Please check your connection.');
                setLoading(false);
            }
        });
    }

    // SIGNUP
    if (signupForm) {
        // Redirect if already logged in
        if (localStorage.getItem('token')) {
            window.location.href = 'index.html';
        }

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            setLoading(true);
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch(`${API_BASE}/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await res.json();

                if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'index.html';
                } else {
                    showError(data.error?.message || data.message || 'Signup failed');
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                showError('Network error. Please check your connection.');
                setLoading(false);
            }
        });
    }
});
