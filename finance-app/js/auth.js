/**
 * Authentication Logic for FinanceFlow
 */
const API_BASE = `${CONFIG.API_BASE_URL}/api/auth`;

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

        const otpModal = document.getElementById('otpModal');
        const otpForm = document.getElementById('otpForm');
        let tempEmail = '';
        let tempPassword = '';

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

                if (res.status === 202 || data.requiresOtp) {
                    // OTP REQUIRED FLOW
                    // Store credentials temporarily (or use a session token if backend provides one)
                    tempEmail = email;
                    tempPassword = password;

                    if (otpModal) {
                        otpModal.classList.add('active');
                        setLoading(false); // Reset login button
                    } else {
                        showError('Partial login success, but OTP modal is missing.');
                    }
                } else if (data.success) {
                    // STANDARD LOGIN SUCCESS
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

        // HANDLE OTP SUBMISSION
        if (otpForm) {
            otpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const otpBtn = document.getElementById('verifyOtpBtn');
                if (otpBtn) {
                    otpBtn.disabled = true;
                    otpBtn.textContent = 'Verifying...';
                }

                const otpCode = document.getElementById('otpCode').value;

                try {
                    const res = await fetch(`${API_BASE}/verify-otp`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: tempEmail,
                            otp: otpCode
                        })
                        // Note: Realistically often we send a temporary session token instead of email again
                    });
                    const data = await res.json();

                    if (data.success) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        window.location.href = 'index.html';
                    } else {
                        alert(data.message || 'Invalid Code');
                        if (otpBtn) {
                            otpBtn.disabled = false;
                            otpBtn.textContent = 'Verify & Login';
                        }
                    }
                } catch (err) {
                    console.error(err);
                    alert('Network Error');
                    if (otpBtn) {
                        otpBtn.disabled = false;
                        otpBtn.textContent = 'Verify & Login';
                    }
                }
            });
        }
    }

    // SIGNUP
    if (signupForm) {
        // Redirect if already logged in
        if (localStorage.getItem('token')) {
            window.location.href = 'index.html';
        }

        const verificationModal = document.getElementById('verificationModal');

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
                    // EMAIL VERIFICATION FLOW
                    // Instead of auto-login, show verification modal
                    if (verificationModal) {
                        verificationModal.classList.add('active');
                        signupForm.reset();
                        setLoading(false);
                    } else {
                        alert('Signup successful! Please check your email to verify your account.');
                        window.location.href = 'login.html';
                    }
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

    // FORGOT PASSWORD
    const forgotLink = document.getElementById('forgotPasswordLink');
    const forgotModal = document.getElementById('forgotPasswordModal');
    const closeForgotBtn = document.getElementById('closeForgotModal');
    const forgotForm = document.getElementById('forgotPasswordForm');
    const sendResetBtn = document.getElementById('sendResetBtn');

    if (forgotLink && forgotModal) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            forgotModal.classList.add('active');
        });

        closeForgotBtn.addEventListener('click', () => {
            forgotModal.classList.remove('active');
        });

        // Close on outside click
        forgotModal.addEventListener('click', (e) => {
            if (e.target === forgotModal) {
                forgotModal.classList.remove('active');
            }
        });

        if (forgotForm) {
            forgotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const resetEmail = document.getElementById('resetEmail').value;

                if (sendResetBtn) {
                    sendResetBtn.disabled = true;
                    sendResetBtn.textContent = 'Sending...';
                }

                try {
                    // Call Backend API
                    const res = await fetch(`${API_BASE}/forgot-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: resetEmail })
                    });

                    const data = await res.json();

                    // For security, often we show success even if email not found, 
                    // but here we'll display what the backend returns or a generic success.
                    alert(data.message || 'If an account exists with this email, a reset link has been sent.');
                    forgotModal.classList.remove('active');
                    forgotForm.reset();

                } catch (err) {
                    console.error(err);
                    alert('Network error. Please try again.');
                } finally {
                    if (sendResetBtn) {
                        sendResetBtn.disabled = false;
                        sendResetBtn.textContent = 'Send Reset Link';
                    }
                }
            });
        }
    }
});
