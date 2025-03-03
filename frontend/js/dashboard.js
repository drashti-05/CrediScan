class Dashboard {
    static init() {
        console.log('Dashboard initialized');
        this.setupFileUpload();
        this.loadStoredResults();
        this.preventFormSubmission();
        this.setupRefreshWarning();
    }

    static preventFormSubmission() {
        const form = document.getElementById('upload-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                return false;
            });
        }
    }

    static setupFileUpload() {
        const fileInput = document.getElementById('file-input');
        const uploadArea = document.getElementById('upload-area');

        // Handle file selection
        fileInput.addEventListener('change', (e) => {
            e.preventDefault();
            const file = e.target.files[0];
            if (file) {
                this.uploadFile(file);
            }
        });

        // Handle drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) {
                this.uploadFile(file);
            }
        });

        // Handle click to upload
        uploadArea.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });
    }

    static async uploadFile(file) {
        const uploadStatus = document.getElementById('upload-status');
        const scanResults = document.getElementById('scan-results');

        try {
            console.log('Starting file upload:', file.name);
            uploadStatus.innerHTML = '<div class="alert alert-info">Processing document...</div>';
            scanResults.style.display = 'none';

            const formData = new FormData();
            formData.append('document', file);

            const response = await API.uploadDocument(formData);
            console.log('Upload response:', response);

            if (response.success) {
                uploadStatus.innerHTML = '<div class="alert alert-success">Document processed successfully!</div>';
                
                // Store results in localStorage
                const dataToStore = {
                    timestamp: Date.now(),
                    data: response
                };
                console.log('Storing data in localStorage:', dataToStore);
                localStorage.setItem('scanResults', JSON.stringify(dataToStore));

                // Display results
                this.displayResults(response);
            }
        } catch (error) {
            console.error('Upload error:', error);
            uploadStatus.innerHTML = `<div class="alert alert-danger">${error.message || 'Upload failed'}</div>`;
        }
    }

    static loadStoredResults() {
        console.log('Loading stored results');
        const stored = localStorage.getItem('scanResults');
        if (stored) {
            console.log('Found stored results:', stored);
            try {
                const { timestamp, data } = JSON.parse(stored);
                if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                    console.log('Displaying stored results:', data);
                    this.displayResults(data);
                } else {
                    console.log('Stored results are too old, removing');
                    localStorage.removeItem('scanResults');
                }
            } catch (error) {
                console.error('Error parsing stored results:', error);
                localStorage.removeItem('scanResults');
            }
        } else {
            console.log('No stored results found');
        }
    }

    static setupRefreshWarning() {
        window.addEventListener('beforeunload', (e) => {
            const scanResults = document.getElementById('scan-results');
            // If scan results are visible, show warning
            if (scanResults && scanResults.style.display !== 'none') {
                e.preventDefault();
                e.returnValue = 'You have scan results on this page. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    static displayResults(response) {
        console.log('Displaying results:', response);
        const scanResults = document.getElementById('scan-results');
        const resultsContent = document.getElementById('results-content');

        if (!scanResults || !resultsContent) {
            console.error('Required DOM elements not found');
            return;
        }

        resultsContent.innerHTML = '';

        // Add a timestamp to the results
        const timestamp = new Date(response.timestamp).toLocaleString();
        const headerHtml = `
            <div class="results-header">
                <div class="scan-info">
                    <p>Scan completed at: ${timestamp}</p>
                    <p>Document: ${response.document.filename}</p>
                </div>
            </div>
        `;

        if (!response.similarDocuments || response.similarDocuments.length === 0) {
            resultsContent.innerHTML = `
                ${headerHtml}
                <div class="alert alert-info">
                    No similar documents found in the database.
                </div>
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Warning: Refreshing this page may clear the results.
                </div>
            `;
        } else {
            const resultsHtml = `
                ${headerHtml}
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Warning: Refreshing this page may clear the results.
                </div>
                <div class="similarity-summary">
                    <h4>Found ${response.similarDocuments.length} similar document(s)</h4>
                </div>
                ${response.similarDocuments.map(doc => `
                    <div class="result-item">
                        <div class="result-header">
                            <h4>Match found in: ${doc.filename}</h4>
                            <div class="similarity-badge ${this.getSimilarityClass(doc.similarity)}">
                                ${doc.similarity}% Similar
                            </div>
                        </div>
                        ${this.formatMatches(doc.matches)}
                    </div>
                `).join('')}
            `;

            resultsContent.innerHTML = resultsHtml;
        }

        scanResults.style.display = 'block';
        console.log('Results displayed');
    }

    static getSimilarityClass(similarity) {
        if (similarity >= 75) return 'high-similarity';
        if (similarity >= 50) return 'medium-similarity';
        return 'low-similarity';
    }

    static formatMatches(matches) {
        if (!matches || matches.length === 0) return '';

        return `
            <div class="matches-container">
                ${matches.map(match => `
                    <div class="match-detail">
                        <div class="match-text">
                            <strong>Original Text:</strong>
                            <pre>${match.original}</pre>
                        </div>
                        <div class="match-text">
                            <strong>Matched Text:</strong>
                            <pre>${match.matched}</pre>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', (e) => {
    e.preventDefault();
    Dashboard.init();
}); 