class AdminDashboard {
    static init() {
        this.loadOverviewStats();
        this.loadCreditRequests();
        this.loadTopUsers();
        this.checkAdminAccess();
    }

    static async checkAdminAccess() {
        const user = JSON.parse(localStorage.getItem(CONFIG.USER_KEY) || '{}');
        if (user.role !== 'admin') {
            window.location.href = './dashboard.html';
        }
    }

    static async loadOverviewStats() {
        try {
            const response = await API.request(CONFIG.ROUTES.ADMIN.OVERVIEW);
            const { statistics } = response;

            document.getElementById('total-users').textContent = statistics.totalUsers;
            document.getElementById('total-documents').textContent = statistics.totalDocuments;
            document.getElementById('pending-requests').textContent = statistics.totalPendingRequests;
            document.getElementById('total-credits').textContent = statistics.totalCreditsIssued;
        } catch (error) {
            console.error('Error loading overview stats:', error);
        }
    }

    static async loadCreditRequests() {
        try {
            const response = await API.request('/credits/requests');
            const tbody = document.getElementById('credit-requests-table');
            
            if (!response.requests || response.requests.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5">No pending credit requests</td></tr>';
                return;
            }

            tbody.innerHTML = response.requests.map(request => `
                <tr>
                    <td>${request.user.username}</td>
                    <td>${request.requestedCredits}</td>
                    <td>${request.reason}</td>
                    <td>${request.status}</td>
                    <td class="action-buttons">
                        ${request.status === 'pending' ? `
                            <button onclick="AdminDashboard.handleCreditRequest(${request.id}, 'approve')" 
                                class="btn btn-small btn-primary">Approve</button>
                            <button onclick="AdminDashboard.handleCreditRequest(${request.id}, 'deny')" 
                                class="btn btn-small btn-secondary">Deny</button>
                        ` : '-'}
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading credit requests:', error);
        }
    }

    static async loadTopUsers() {
        try {
            const response = await API.request(CONFIG.ROUTES.ADMIN.USERS);
            const tbody = document.getElementById('top-users-table');
            
            if (!response.topUsers || response.topUsers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4">No users found</td></tr>';
                return;
            }

            tbody.innerHTML = response.topUsers.map(user => `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.scanCount}</td>
                    <td>${user.credits}</td>
                    <td class="action-buttons">
                        <button onclick="AdminDashboard.showUserDetails(${user.id})" 
                            class="btn btn-small btn-primary">Details</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading top users:', error);
        }
    }

    static async handleCreditRequest(requestId, action) {
        try {
            await API.request(`/credits/requests/${requestId}/${action}`, {
                method: 'POST'
            });
            
            // Refresh the tables
            this.loadCreditRequests();
            this.loadOverviewStats();
        } catch (error) {
            alert(error.message || `Error ${action}ing request`);
        }
    }

    static async showUserDetails(userId) {
        // Implement user details view
        alert('User details feature coming soon!');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const overview = await API.getAdminOverview();
        const creditRequests = await API.getCreditRequests();
        const topUsers = await API.getTopUsers();

        displayOverview(overview);
        displayCreditRequests(creditRequests);
        displayTopUsers(topUsers);
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
});

function displayOverview(data) {
    const overviewDiv = document.getElementById('overview');
    overviewDiv.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${data.statistics.totalUsers}</div>
            <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.statistics.totalDocuments}</div>
            <div class="stat-label">Documents Processed</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.statistics.totalPendingRequests}</div>
            <div class="stat-label">Pending Requests</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.statistics.totalCreditsIssued || 0}</div>
            <div class="stat-label">Credits Issued</div>
        </div>
    `;
}

function displayCreditRequests(data) {
    const requestsDiv = document.getElementById('credit-requests');
    if (!data.requests || data.requests.length === 0) {
        requestsDiv.innerHTML = '<p>No pending credit requests</p>';
        return;
    }

    requestsDiv.innerHTML = `
        <div class="credit-requests-list">
            ${data.requests.map(request => `
                <div class="credit-request-item" id="request-${request.id}">
                    <p><strong>User:</strong> ${request.username}</p>
                    <p><strong>Requested Credits:</strong> ${request.requestedCredits}</p>
                    <p><strong>Request Reason:</strong> ${request.reason || 'No reason provided'}</p>
                    <p><strong>Status:</strong> ${request.status}</p>
                    <p><strong>Requested on:</strong> ${new Date(request.createdAt).toLocaleDateString()}</p>
                    ${request.status === 'pending' ? `
                        <div class="request-actions">
                            <button class="btn btn-success" onclick="handleCreditRequest(${request.id}, 'approve')">
                                Approve
                            </button>
                            <button class="btn btn-danger" onclick="showDenyDialog(${request.id})">
                                Deny
                            </button>
                        </div>
                    ` : ''}
                    ${request.adminResponse ? `
                        <p class="admin-response"><strong>Admin Response:</strong> ${request.adminResponse}</p>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        <!-- Deny Dialog -->
        <div id="deny-dialog" class="modal" style="display: none;">
            <div class="modal-content">
                <h3>Deny Credit Request</h3>
                <form id="deny-form">
                    <input type="hidden" id="request-id">
                    <div class="form-group">
                        <label for="deny-reason">Reason for Denial:</label>
                        <textarea id="deny-reason" class="form-control" required></textarea>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeDenyDialog()">Cancel</button>
                        <button type="submit" class="btn btn-danger">Confirm Denial</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Setup deny form handler
    setupDenyForm();
}

async function handleCreditRequest(requestId, action, reason = '') {
    try {
        const endpoint = action === 'approve' 
            ? CONFIG.ROUTES.ADMIN.APPROVE_CREDIT(requestId)
            : CONFIG.ROUTES.ADMIN.DENY_CREDIT(requestId);

        const response = await API.request(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason })
        });

        if (response.success) {
            // Show success message first
            alert(`Request ${action}ed successfully`);
            
            // Then refresh the dashboard
            const requestsResponse = await API.request(CONFIG.ROUTES.ADMIN.CREDIT_REQUESTS);
            if (requestsResponse.success) {
                displayCreditRequests(requestsResponse);
                
                // Also refresh overview stats
                const overviewResponse = await API.request(CONFIG.ROUTES.ADMIN.OVERVIEW);
                if (overviewResponse.success) {
                    displayOverview(overviewResponse);
                }
            }

            // Close deny dialog if it was a denial
            if (action === 'deny') {
                closeDenyDialog();
            }
        } else {
            throw new Error(response.message || `Failed to ${action} request`);
        }
    } catch (error) {
        console.error(`Error ${action}ing request:`, error);
        // Only show alert if it's a real error, not just a refresh error
        if (!error.message.includes('Failed to fetch')) {
            alert(`Error ${action}ing request: ${error.message}`);
        }
    }
}

function showDenyDialog(requestId) {
    const dialog = document.getElementById('deny-dialog');
    document.getElementById('request-id').value = requestId;
    document.getElementById('deny-reason').value = ''; // Clear previous reason
    dialog.style.display = 'block';
}

function closeDenyDialog() {
    const dialog = document.getElementById('deny-dialog');
    dialog.style.display = 'none';
    document.getElementById('deny-reason').value = '';
}

function displayTopUsers(data) {
    const usersDiv = document.getElementById('top-users');
    if (!data.topUsers || data.topUsers.length === 0) {
        usersDiv.innerHTML = '<p>No users found</p>';
        return;
    }

    usersDiv.innerHTML = `
        <div class="top-users-list">
            ${data.topUsers.map(user => `
                <div class="user-card">
                    <p><strong>${user.username}</strong></p>
                    <div class="credits-section">
                        <p>Current Credits: <span id="user-${user.id}-credits">${user.credits}</span></p>
                        <div class="credit-controls">
                            <input type="number" 
                                id="credits-${user.id}" 
                                min="0" 
                                value="${user.credits}" 
                                class="form-control credit-input">
                            <input type="text" 
                                id="reason-${user.id}" 
                                placeholder="Reason for modification" 
                                class="form-control reason-input">
                            <button onclick="handleCreditModification(${user.id})" 
                                class="btn btn-primary btn-small">
                                Update Credits
                            </button>
                        </div>
                    </div>
                    <p>Documents Scanned: ${user.scanCount}</p>
                </div>
            `).join('')}
        </div>
    `;
}

// Update the deny form handler
function setupDenyForm() {
    const denyForm = document.getElementById('deny-form');
    if (denyForm) {
        denyForm.onsubmit = async (e) => {
            e.preventDefault();
            const requestId = document.getElementById('request-id').value;
            const reason = document.getElementById('deny-reason').value;
            
            if (!reason.trim()) {
                alert('Please provide a reason for denial');
                return;
            }
            
            await handleCreditRequest(requestId, 'deny', reason);
        };
    }
}

// Add this new function to handle credit modifications
async function handleCreditModification(userId) {
    try {
        const creditsInput = document.getElementById(`credits-${userId}`);
        const reasonInput = document.getElementById(`reason-${userId}`);
        const credits = parseInt(creditsInput.value);
        const reason = reasonInput.value.trim();

        if (isNaN(credits) || credits < 0) {
            alert('Please enter a valid number of credits');
            return;
        }

        const response = await API.request(CONFIG.ROUTES.ADMIN.MODIFY_CREDITS(userId), {
            method: 'POST',
            body: JSON.stringify({ credits, reason })
        });

        if (response.success) {
            // Update the displayed credit value
            const creditDisplay = document.getElementById(`user-${userId}-credits`);
            creditDisplay.textContent = credits;
            
            alert('Credits updated successfully');
            
            // Clear the reason input
            reasonInput.value = '';
        } else {
            throw new Error(response.message || 'Failed to update credits');
        }
    } catch (error) {
        console.error('Error modifying credits:', error);
        alert('Error updating credits: ' + error.message);
    }
} 