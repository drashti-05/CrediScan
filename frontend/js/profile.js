class Profile {
    static init() {
        this.loadUserData();
        this.setupTabs();
        this.setupCreditRequestForm();
        this.setupTabContentLoading();
        
        // Add reload warning
        window.addEventListener('beforeunload', (e) => {
            // Check if there's an ongoing credit request or form being filled
            const creditForm = document.getElementById('credit-request-form');
            const hasUnsubmittedForm = creditForm && (
                creditForm.credits.value || 
                creditForm.reason.value
            );
            
            if (hasUnsubmittedForm) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave this page? Your data may be lost.';
                return e.returnValue;
            }
        });

        // Add data persistence on page hide
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                // Save form data
                const creditForm = document.getElementById('credit-request-form');
                if (creditForm) {
                    localStorage.setItem('creditFormData', JSON.stringify({
                        credits: creditForm.credits.value,
                        reason: creditForm.reason.value
                    }));
                }
            }
        });

        // Restore form data if exists
        const savedFormData = localStorage.getItem('creditFormData');
        if (savedFormData) {
            try {
                const { credits, reason } = JSON.parse(savedFormData);
                const creditForm = document.getElementById('credit-request-form');
                if (creditForm) {
                    creditForm.credits.value = credits;
                    creditForm.reason.value = reason;
                }
            } catch (error) {
                console.error('Error restoring form data:', error);
            }
        }
    }

    static async loadUserData() {
        try {
            const response = await API.getUserProfile();
            if (response.success && response.user) {
                document.getElementById('username').textContent = response.user.username;
                document.getElementById('credit-count').textContent = response.user.credits;
                document.getElementById('profile-credits').textContent = response.user.credits;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    static setupTabs() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and panes
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding pane
                tab.classList.add('active');
                const targetPane = document.getElementById(`${tab.dataset.tab}-tab`);
                targetPane.classList.add('active');

                // Load content based on tab
                switch(tab.dataset.tab) {
                    case 'history':
                        this.loadScanHistory();
                        break;
                    case 'requests':
                        this.loadCreditRequestStatus();
                        break;
                }
            });
        });

        // Load initial tab content if it's active
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab && activeTab.dataset.tab === 'requests') {
            this.loadCreditRequestStatus();
        }
    }

    static async loadScanHistory() {
        try {
            const response = await API.getUserScanHistory();
            const scanHistory = document.getElementById('scan-history');
            
            if (!response.success || !response.documents) {
                scanHistory.innerHTML = '<li>No scans yet</li>';
                return;
            }

            const documents = response.documents;
            if (documents.length === 0) {
                scanHistory.innerHTML = '<li>No scans yet</li>';
                return;
            }

            scanHistory.innerHTML = documents
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(doc => `
                    <li class="scan-item">
                        <div>
                            <strong>${doc.filename}</strong>
                            <br>
                            <small>${new Date(doc.createdAt).toLocaleString()}</small>
                        </div>
                        <span class="status-badge status-${doc.processingStatus.toLowerCase()}">
                            ${doc.processingStatus}
                        </span>
                    </li>
                `).join('');
        } catch (error) {
            console.error('Error loading scan history:', error);
            document.getElementById('scan-history').innerHTML = 
                '<li>Error loading scan history</li>';
        }
    }

    static setupCreditRequestForm() {
        const form = document.getElementById('credit-request-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    const credits = form.credits.value;
                    const reason = form.reason.value;

                    const response = await API.request(CONFIG.ROUTES.CREDITS.REQUEST, {
                        method: 'POST',
                        body: JSON.stringify({
                            requestedCredits: credits,
                            reason: reason
                        })
                    });

                    if (response.success) {
                        alert('Credit request submitted successfully');
                        form.reset();
                        this.clearSavedFormData(); // Clear saved form data
                        // Only reload credit requests if we're on the requests tab
                        const requestsTab = document.querySelector('.tab-btn[data-tab="requests"]');
                        if (requestsTab.classList.contains('active')) {
                            await this.loadCreditRequestStatus();
                        }
                    }
                } catch (error) {
                    console.error('Credit request error:', error);
                    alert('Error submitting credit request');
                }
            });
        }
    }

    static async loadCreditRequestStatus() {
        try {
            const response = await API.getUserCreditRequests();
            const container = document.getElementById('credit-requests-status');
            
            if (!response.success || !response.creditRequests) {
                container.innerHTML = '<p>No credit requests found</p>';
                return;
            }

            const requests = response.creditRequests;
            if (requests.length === 0) {
                container.innerHTML = '<p>No credit requests found</p>';
                return;
            }

            container.innerHTML = requests
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map(req => `
                    <div class="request-item ${req.status.toLowerCase()}">
                        <p><strong>Requested Credits:</strong> ${req.requestedCredits}</p>
                        <p><strong>Reason:</strong> ${req.reason}</p>
                        <p><strong>Status:</strong> 
                            <span class="status-badge status-${req.status.toLowerCase()}">${req.status}</span>
                        </p>
                        ${req.status === 'denied' && req.adminResponse ? `
                            <div class="admin-feedback">
                                <p><strong>Denial Reason:</strong></p>
                                <p class="admin-message">${req.adminResponse}</p>
                            </div>
                        ` : ''}
                        <p><strong>Requested on:</strong> ${new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                `).join('');
        } catch (error) {
            console.error('Error loading credit requests:', error);
            document.getElementById('credit-requests-status').innerHTML = 
                '<p>Error loading credit requests</p>';
        }
    }

    static setupTabContentLoading() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and panes
                tabs.forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding pane
                tab.classList.add('active');
                const targetPane = document.getElementById(`${tab.dataset.tab}-tab`);
                targetPane.classList.add('active');

                // Load content based on tab
                switch(tab.dataset.tab) {
                    case 'history':
                        this.loadScanHistory();
                        break;
                    case 'requests':
                        this.loadCreditRequestStatus();
                        break;
                }
            });
        });

        // Load initial tab content if it's active
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab && activeTab.dataset.tab === 'requests') {
            this.loadCreditRequestStatus();
        }
    }

    static clearSavedFormData() {
        localStorage.removeItem('creditFormData');
    }
}

// Initialize profile when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    Profile.init();
}); 