/**
 * Authentication Logic for FinanceFlow
 * Using Supabase Auth - Direct Connection
 */

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

    function hideError() {
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    function setLoading(isLoading) {
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.textContent = isLoading ? 'Processing...' : (loginForm ? 'Login' : 'Sign Up');
        }
    }

    // Check if already logged in
    async function checkSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            window.location.href = 'index.html';
        }
    }

    // LOGIN
    if (loginForm) {
        checkSession();

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            setLoading(true);

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) {
                    if (error.message.includes('Email not confirmed')) {
                        showError('Please verify your email before logging in. Check your inbox for the verification link.');
                    } else {
                        showError(error.message || 'Login failed');
                    }
                    setLoading(false);
                    return;
                }

                if (data.session) {
                    // Store user info in localStorage for quick access
                    const userProfile = await getUserProfile(data.user.id);
                    localStorage.setItem('user', JSON.stringify({
                        id: data.user.id,
                        email: data.user.email,
                        name: data.user.user_metadata?.name || userProfile?.name || 'User',
                        avatar: userProfile?.avatar || null,
                        phone: userProfile?.phone || null,
                        created_at: data.user.created_at
                    }));

                    window.location.href = 'index.html';
                }
            } catch (err) {
                console.error('Login error:', err);
                showError('Network error. Please check your connection.');
                setLoading(false);
            }
        });
    }

    // SIGNUP
    if (signupForm) {
        checkSession();

        const verificationModal = document.getElementById('verificationModal');

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError();
            setLoading(true);

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const { data, error } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name: name
                        },
                        emailRedirectTo: window.location.origin + '/verify.html'
                    }
                });

                if (error) {
                    showError(error.message || 'Signup failed');
                    setLoading(false);
                    return;
                }

                if (data.user) {
                    // Create user profile in users table
                    await supabaseClient.from('users').insert({
                        id: data.user.id,
                        name: name,
                        email: email,
                        role: 'user',
                        is_verified: false
                    });

                    // Show verification modal
                    if (verificationModal) {
                        verificationModal.classList.add('active');
                        signupForm.reset();
                        setLoading(false);
                    } else {
                        alert('Signup successful! Please check your email to verify your account.');
                        window.location.href = 'login.html';
                    }
                }
            } catch (err) {
                console.error('Signup error:', err);
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
                    const { error } = await supabaseClient.auth.resetPasswordForEmail(resetEmail, {
                        redirectTo: window.location.origin + '/login.html'
                    });

                    if (error) {
                        alert(error.message);
                    } else {
                        alert('Password reset link sent! Check your email.');
                        forgotModal.classList.remove('active');
                        forgotForm.reset();
                    }
                } catch (err) {
                    console.error('Reset password error:', err);
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

    // Helper function to get user profile from database
    async function getUserProfile(userId) {
        try {
            const { data, error } = await supabaseClient
                .from('users')
                .select('name, avatar, phone')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('Could not fetch user profile:', error);
                return null;
            }
            return data;
        } catch (err) {
            console.warn('Error fetching user profile:', err);
            return null;
        }
    }
});
