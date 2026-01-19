/**
 * Profile Manager - Handles Profile Page Logic
 */
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.avatarBase64 = null;
    }

    /**
     * Initialize Profile Manager
     */
    async init() {
        // Bind Form Submit
        const form = document.getElementById('fullProfileForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        // Bind File Input
        const avatarInput = document.getElementById('pageAvatarInput');
        if (avatarInput) {
            avatarInput.addEventListener('change', (e) => this.handleAvatarChange(e));
        }

        // Load user data for header and page
        await this.loadCurrentUser();
    }

    /**
     * Load current user data from API
     */
    async loadCurrentUser() {
        try {
            const userData = await dataLayer._request('/auth/me');
            this.currentUser = userData.user || userData;

            this.updateHeaderAvatar();

            // If profile page is active, render it
            if (document.getElementById('profilePage') &&
                document.getElementById('profilePage').classList.contains('active')) {
                this.renderProfilePage();
            }
        } catch (error) {
            console.warn('Failed to load user data:', error);
        }
    }

    /**
     * Update Header Avatar
     */
    updateHeaderAvatar() {
        const avatarEl = document.querySelector('.user-profile .avatar');
        if (!avatarEl || !this.currentUser) return;

        if (this.currentUser.avatar) {
            avatarEl.innerHTML = `<img src="${this.currentUser.avatar}" alt="${this.currentUser.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            avatarEl.innerHTML = `<span>${this.getInitials(this.currentUser.name)}</span>`;
        }
    }

    /**
     * Render Profile Page Content
     */
    renderProfilePage() {
        if (!this.currentUser) {
            // Try loading if missing
            this.loadCurrentUser();
            return;
        }

        // Update Identity Card
        const nameEl = document.getElementById('displayProfileName');
        const emailEl = document.getElementById('displayProfileEmail');
        const joinedEl = document.getElementById('displayJoinedDate');

        if (nameEl) nameEl.textContent = this.currentUser.name;
        if (emailEl) emailEl.textContent = this.currentUser.email;
        if (joinedEl) joinedEl.textContent = this.formatDate(this.currentUser.created_at);

        this.renderPageAvatar(this.currentUser.avatar, this.currentUser.name);

        // Update Form Fields
        const fName = document.getElementById('pageProfileName');
        const fEmail = document.getElementById('pageProfileEmail');
        const fPhone = document.getElementById('pageProfilePhone');

        if (fName) fName.value = this.currentUser.name || '';
        if (fEmail) fEmail.value = this.currentUser.email || '';
        if (fPhone) fPhone.value = this.currentUser.phone || '';

        // Reset Password Fields
        const pCurrent = document.getElementById('pageCurrentPassword');
        const pNew = document.getElementById('pageNewPassword');
        if (pCurrent) pCurrent.value = '';
        if (pNew) pNew.value = '';
    }

    /**
     * Render Avatar on Page
     */
    renderPageAvatar(src, name) {
        const img = document.getElementById('pageAvatarPreview');
        const placeholder = document.getElementById('pageAvatarPlaceholder');

        if (!img || !placeholder) return;

        if (src) {
            img.src = src;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        } else {
            img.style.display = 'none';
            placeholder.style.display = 'flex';
            placeholder.textContent = this.getInitials(name);
        }
    }

    /**
     * Handle File Input Change
     */
    handleAvatarChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast('Image size should be less than 5MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            this.avatarBase64 = event.target.result;
            // Optimistic update
            this.renderPageAvatar(this.avatarBase64, document.getElementById('pageProfileName').value);
        };
        reader.readAsDataURL(file);
    }

    /**
     * Save Profile Changes
     */
    async saveProfile() {
        const name = document.getElementById('pageProfileName').value;
        const email = document.getElementById('pageProfileEmail').value;
        const phone = document.getElementById('pageProfilePhone').value;
        const currentPassword = document.getElementById('pageCurrentPassword').value;
        const newPassword = document.getElementById('pageNewPassword').value;

        if (newPassword && !currentPassword) {
            showToast('Current password required to set new password', 'warning');
            document.getElementById('pageCurrentPassword').focus();
            return;
        }

        try {
            const payload = {
                name,
                email,
                phone,
                avatar: this.avatarBase64 !== null ? this.avatarBase64 : undefined,
                currentPassword: currentPassword || undefined,
                newPassword: newPassword || undefined
            };

            showToast('Updating profile...', 'info');

            const result = await dataLayer._request('/auth/profile', {
                method: 'PUT',
                body: payload
            });

            if (result.success) {
                showToast('Profile updated successfully', 'success');

                if (result.user) {
                    this.currentUser = result.user;
                    localStorage.setItem('user', JSON.stringify(result.user));

                    // Update UI
                    this.updateHeaderAvatar();
                    this.renderProfilePage();

                    // Clear password fields
                    document.getElementById('pageCurrentPassword').value = '';
                    document.getElementById('pageNewPassword').value = '';
                    this.avatarBase64 = null;
                }
            } else {
                showToast(result.message || 'Update failed', 'error');
            }
        } catch (error) {
            console.error('Profile Update Error:', error);
            showToast(error.message || 'Failed to update profile', 'error');
        }
    }

    getInitials(name) {
        return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Create instance and expose to window
window.profileManager = new ProfileManager();
