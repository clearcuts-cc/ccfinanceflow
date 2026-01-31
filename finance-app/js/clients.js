/**
 * FinanceFlow - Clients Manager
 * Handles client CRUD operations and UI
 */

class ClientsManager {
    constructor() {
        this.clients = [];
    }

    /**
     * Initialize clients manager
     */
    async init() {
        this.bindEvents();
        await this.loadClients();
        await this.populateClientDropdowns();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Add client button - using event delegation for robustness
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('#addClientBtn');
            if (btn) {
                e.preventDefault();
                console.log('Add Client button clicked (via delegation)');
                this.openClientModal();
            }
        });

        // Client form
        document.getElementById('clientForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveClient();
        });

        // Close modal
        document.getElementById('closeClientModal').addEventListener('click', () => this.closeClientModal());
        document.getElementById('cancelClient').addEventListener('click', () => this.closeClientModal());

        // Close on overlay click
        document.getElementById('clientModal').addEventListener('click', (e) => {
            if (e.target.id === 'clientModal') this.closeClientModal();
        });

        // Invoice client select - auto-fill on change
        document.getElementById('invoiceClientSelect').addEventListener('change', (e) => {
            this.onInvoiceClientSelect(e.target.value);
        });

        // Subscribe to client changes
        dataLayer.subscribe(DATA_STORES.CLIENTS, () => {
            this.loadClients();
            this.populateClientDropdowns();
        });
    }

    async saveClient() {
        const id = document.getElementById('clientId').value;

        // Get user info to determine initial status
        const role = await dataLayer.getCurrentUserRole();
        const userName = await dataLayer.getCurrentUserName();
        const initialStatus = role === 'admin' ? 'approved' : 'pending';
        const roleLabel = role === 'admin' ? 'Admin' : 'Employee';

        const client = {
            name: document.getElementById('clientName').value.trim(),
            phone: document.getElementById('clientPhone').value.trim(),
            email: document.getElementById('clientEmail').value.trim(),
            address: document.getElementById('clientAddress').value.trim(),
            approval_status: initialStatus,
            created_by_name: `${roleLabel} - ${userName}`
        };

        if (!client.name) { // Phone optional?
            showToast('Please fill in required fields', 'error');
            return;
        }

        try {
            if (id) {
                // Update existing
                await dataLayer.updateClient(parseInt(id), client);
                showToast('Client updated successfully', 'success');
            } else {
                // Add new
                await dataLayer.addClient(client);
                if (role === 'admin') {
                    showToast('Client added successfully', 'success');
                } else {
                    showToast('Client submitted for approval', 'info');
                }
            }

            this.closeClientModal();
        } catch (error) {
            console.error('Error saving client:', error);
            showToast('Failed to save client', 'error');
        }
    }

    /**
     * Delete client (or Decline if pending)
     */
    async deleteClient(id) {
        if (!(await app.showConfirmationModal('Delete Client', 'Are you sure you want to delete this client?'))) return;

        try {
            await dataLayer.deleteClient(id);
            showToast('Client deleted', 'success');
        } catch (error) {
            console.error('Error deleting client:', error);
            showToast('Failed to delete client', 'error');
        }
    }

    async approveClient(id) {
        try {
            const client = this.pendingClients.find(c => c.id === id);
            if (!client) return;

            if (client.deletion_requested) {
                await dataLayer.deleteClient(id); // Admin confirm delete
                showToast('Client deletion approved', 'success');
            } else if (client.edit_requested) {
                await dataLayer.approveClientEdit(id);
                showToast('Client edit approved', 'success');
            } else {
                await dataLayer.updateClient(id, { approval_status: 'approved' });
                showToast('Client creation approved', 'success');
            }
        } catch (error) {
            console.error('Error approving client:', error);
            showToast('Failed to approve request', 'error');
        }
    }

    /**
     * Decline a pending client request
     */
    async declineClient(id) {
        try {
            const client = this.pendingClients.find(c => c.id === id);
            if (!client) return;

            const action = client.deletion_requested ? 'deletion' : (client.edit_requested ? 'edit' : 'creation');

            if (!(await app.showConfirmationModal('Decline Request', `Are you sure you want to decline this client ${action} request?`))) return;

            if (client.deletion_requested) {
                await dataLayer.declineClientDeletion(id);
                showToast('Deletion request declined', 'info');
            } else if (client.edit_requested) {
                await dataLayer.declineClientEdit(id);
                showToast('Edit request declined', 'info');
            } else {
                await dataLayer.deleteClient(id); // Decline new creation = delete
                showToast('Client creation declined', 'info');
            }
        } catch (error) {
            console.error('Error declining client:', error);
            showToast('Failed to decline request', 'error');
        }
    }

    /**
     * Populate client dropdowns in entry and invoice forms
     */
    async populateClientDropdowns() {
        const clients = await dataLayer.getAllClients(true); // true = approved only

        // Entry form dropdown
        const entryClientSelect = document.getElementById('entryClient');
        if (entryClientSelect) {
            const currentValue = entryClientSelect.value;
            entryClientSelect.innerHTML = `
                <option value="">Select Client</option>
                ${clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
            `;
            if (currentValue) {
                entryClientSelect.value = currentValue;
            }
        }

        // Invoice form dropdown
        const invoiceClientSelect = document.getElementById('invoiceClientSelect');
        if (invoiceClientSelect) {
            invoiceClientSelect.innerHTML = `
                <option value="">-- Select a saved client --</option>
                ${clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            `;
        }
    }

    /**
     * Load all clients
     */
    async loadClients() {
        // Load Approved Clients
        this.clients = await dataLayer.getAllClients(true); // true = approved only
        this.pendingClients = [];

        // If Admin, also load pending clients
        const isAdmin = await dataLayer.isAdmin();
        if (isAdmin) {
            this.pendingClients = await dataLayer.getPendingClients();
        }

        this.renderClientsGrid();
    }

    /**
     * Render clients grid with Pending Section
     */
    renderClientsGrid() {
        const grid = document.getElementById('clientsGrid');
        const emptyState = document.getElementById('clientsEmptyState');

        grid.innerHTML = '';
        let hasContent = false;

        // 1. Render Pending Approvals (Admin Only)
        if (this.pendingClients && this.pendingClients.length > 0) {
            hasContent = true;

            const pendingSection = document.createElement('div');
            pendingSection.className = 'pending-clients-section full-width';
            pendingSection.innerHTML = `
                <div class="section-header" style="margin-top: 0;">
                    <h3>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-sm" style="color: var(--color-warning);">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                        Pending Client Approvals
                        <span class="badge badge-warning">${this.pendingClients.length}</span>
                    </h3>
                </div>
                <div class="pending-clients-grid">
                    ${this.pendingClients.map(client => this.renderClientCard(client, true)).join('')}
                </div>
                <div class="divider" style="margin: 2rem 0; border-top: 1px solid var(--color-border);"></div>
            `;
            grid.appendChild(pendingSection);

            // Bind Pending Buttons
            pendingSection.querySelectorAll('.approve-client').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.approveClient(parseInt(btn.dataset.id));
                });
            });

            pendingSection.querySelectorAll('.decline-client').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.declineClient(parseInt(btn.dataset.id));
                });
            });
        }

        // 2. Render Approved Clients
        if (this.clients.length > 0) {
            hasContent = true;
            this.clients.forEach(client => {
                const card = document.createElement('div');
                card.innerHTML = this.renderClientCard(client, false);
                // Unwrap the string to get the HTML element or just append snippet? 
                // Grid is flex/grid, so we append the string directly to innerHTML is easier but we are doing partials.
                // Let's attach to a container or direct append string.
                // Actually, let's just append string to grid.innerHTML
            });

            // Append Approved Clients HTML
            const approvedHtml = this.clients.map(c => this.renderClientCard(c, false)).join('');
            grid.insertAdjacentHTML('beforeend', approvedHtml);

            // Bind Approved Buttons
            grid.querySelectorAll('.edit-client').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const clientId = parseInt(btn.dataset.id);
                    const client = this.clients.find(c => c.id === clientId);
                    this.openClientModal(client);
                });
            });

            grid.querySelectorAll('.delete-client').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteClient(parseInt(btn.dataset.id));
                });
            });
        }

        if (!hasContent) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
    }

    /**
     * Helper to render single card HTML
     */
    renderClientCard(client, isPending) {
        const initials = this.getInitials(client.name);

        let actionsHtml = '';
        let badgeHtml = '';
        let cardStyle = '';

        if (isPending) {
            let label = 'Pending Approval';
            if (client.deletion_requested) label = 'Deletion Requested';
            else if (client.edit_requested) label = 'Edit Requested';

            badgeHtml = `<span class="badge ${client.deletion_requested ? 'badge-danger' : 'badge-warning'}" style="margin-bottom: 8px; display: inline-block;">${label}</span>`;
            cardStyle = `border: 1px solid ${client.deletion_requested ? 'var(--color-danger)' : 'var(--color-warning)'}; background: var(--color-bg-secondary);`;

            actionsHtml = `
                <div class="client-card-actions two-buttons">
                     <button class="btn btn-success btn-sm approve-client full-width" data-id="${client.id}">Approve</button>
                     <button class="btn btn-danger btn-sm decline-client full-width" data-id="${client.id}">Decline</button>
                </div>
            `;

            if (client.edit_requested && client.pending_changes) {
                const changes = client.pending_changes;
                badgeHtml += `
                    <div class="pending-changes-preview" style="font-size: 0.7rem; color: var(--color-text-muted); padding: 8px; background: rgba(0,0,0,0.05); border-radius: 4px; margin-bottom: 8px;">
                        <strong>New Name:</strong> ${changes.name}<br>
                        <strong>New Phone:</strong> ${changes.phone || 'N/A'}<br>
                        <strong>New Email:</strong> ${changes.email || 'N/A'}<br>
                        <strong>New Address:</strong> ${changes.address ? 'Updated' : 'N/A'}
                    </div>
                `;
            }
        } else {
            actionsHtml = `
                <div class="client-card-actions">
                    <button class="btn btn-secondary btn-sm edit-client" data-id="${client.id}">Edit</button>
                    <button class="btn btn-danger btn-sm delete-client" data-id="${client.id}">Delete</button>
                </div>
            `;
        }

        return `
            <div class="client-card ${isPending ? 'pending-card' : ''}" data-id="${client.id}" style="${cardStyle}">
                <div class="client-card-header">
                    <div class="client-avatar" style="${isPending && !client.deletion_requested ? 'background: var(--color-warning);' : (isPending ? 'background: var(--color-danger);' : '')}">${initials}</div>
                    <div class="client-info">
                        ${badgeHtml}
                        <div class="client-name">${client.name}</div>
                        ${client.phone ? `
                        <div class="client-phone">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                            ${client.phone}
                        </div>
                        ` : ''}
                        ${client.email ? `
                        <div class="client-phone" style="margin-top: 2px;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                <polyline points="22,6 12,13 2,6"/>
                            </svg>
                            ${client.email}
                        </div>
                        ` : ''}
                        ${isPending ? `<div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px;">By: ${client.created_by_name || 'Unknown'}</div>` : ''}
                    </div>
                </div>
                ${client.address ? `<div class="client-address">${client.address.replace(/\n/g, '<br>')}</div>` : ''}
                ${actionsHtml}
            </div>
        `;
    }

    /**
     * Get initials from name
     */
    getInitials(name) {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }

    /**
     * Open client modal
     */
    openClientModal(client = null) {
        console.log('Opening Client Modal...', client ? 'Edit Mode' : 'Add Mode');
        const modal = document.getElementById('clientModal');
        const title = document.getElementById('clientModalTitle');
        const form = document.getElementById('clientForm');

        if (!modal) {
            console.error('FATAL: Client modal element not found!');
            return;
        }

        form.reset();

        if (client) {
            title.textContent = 'Edit Client';
            document.getElementById('clientId').value = client.id;
            document.getElementById('clientName').value = client.name;
            document.getElementById('clientPhone').value = client.phone;
            document.getElementById('clientEmail').value = client.email || '';
            document.getElementById('clientAddress').value = client.address || '';
        } else {
            title.textContent = 'Add Client';
            document.getElementById('clientId').value = '';
        }

        // Force display flex and then add active class for animation
        modal.style.display = 'flex';
        // Small timeout to allow display change to register before opacity transition
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
    }

    /**
     * Close client modal
     */
    closeClientModal() {
        console.log('Closing Client Modal');
        const modal = document.getElementById('clientModal');
        modal.classList.remove('active');

        // Wait for transition to finish before hiding
        setTimeout(() => {
            modal.style.display = '';
        }, 300);
    }


    /**
     * Handle invoice client selection - auto-fill client details
     */
    async onInvoiceClientSelect(clientId) {
        if (!clientId) {
            // Clear fields if no client selected
            document.getElementById('invoiceClientName').value = '';
            document.getElementById('invoiceClientPhone').value = '';
            document.getElementById('invoiceClientAddress').value = '';
            return;
        }

        const client = await dataLayer.getClient(parseInt(clientId));
        if (client) {
            document.getElementById('invoiceClientName').value = client.name;
            document.getElementById('invoiceClientPhone').value = client.phone || '';
            document.getElementById('invoiceClientAddress').value = client.address || '';

            // Fix: Populate Email if available to prevent data cutoff/loss
            const emailField = document.getElementById('invoiceClientEmail');
            if (emailField) {
                emailField.value = client.email || '';
            }
        }
    }

    /**
     * Get client name options for autocomplete
     */
    getClientNames() {
        return this.clients.map(c => c.name);
    }
}

// Create singleton instance
const clientsManager = new ClientsManager();
