class CookieViewer {
    constructor() {
        this.cookies = [];
        this.filteredCookies = [];
        this.currentTab = null;
        this.init();
    }

    async init() {
        await this.getCurrentTab();
        this.setupEventListeners();
        await this.loadCookies();
    }

    async getCurrentTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;
        } catch (error) {
            this.showError('Failed to get current tab: ' + error.message);
        }
    }

    setupEventListeners() {
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadCookies());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAllCookies());
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterCookies());
        
        // Add event listeners for all filter checkboxes
        const filterCheckboxes = document.querySelectorAll('.filter-checkboxes input[type="checkbox"]');
        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.filterCookies());
        });
    }

    async loadCookies() {
        this.showLoading(true);
        this.hideError();

        try {
            if (!this.currentTab || !this.currentTab.url) {
                throw new Error('No active tab found');
            }

            const url = new URL(this.currentTab.url);
            
            // Get all cookies for the current domain using Chrome's cookies API
            // This will include HTTP-only cookies that regular JavaScript cannot access
            const allCookies = await chrome.cookies.getAll({ domain: url.hostname });
            
            // Also try to get cookies for the full URL
            const urlCookies = await chrome.cookies.getAll({ url: this.currentTab.url });
            
            // Combine and deduplicate cookies
            const cookieMap = new Map();
            [...allCookies, ...urlCookies].forEach(cookie => {
                const key = `${cookie.name}-${cookie.domain}-${cookie.path}`;
                cookieMap.set(key, cookie);
            });
            
            this.cookies = Array.from(cookieMap.values());
            this.filterCookies();
            this.updateStats();
            
            // Trigger badge update in background script
            this.updateBadge();
            
        } catch (error) {
            this.showError('Failed to load cookies: ' + error.message);
            this.cookies = [];
            this.filteredCookies = [];
            this.updateStats();
            
            // Trigger badge update even on error
            this.updateBadge();
        } finally {
            this.showLoading(false);
        }
    }

    filterCookies() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        // Get all checked filter values
        const checkedFilters = Array.from(document.querySelectorAll('.filter-checkboxes input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        this.filteredCookies = this.cookies.filter(cookie => {
            // Search filter
            const matchesSearch = !searchTerm || 
                cookie.name.toLowerCase().includes(searchTerm) ||
                cookie.value.toLowerCase().includes(searchTerm) ||
                cookie.domain.toLowerCase().includes(searchTerm);

            // If no filters are selected, show all cookies (that match search)
            if (checkedFilters.length === 0) {
                return matchesSearch;
            }

            // Check if cookie matches any of the selected filters
            const matchesFilters = checkedFilters.some(filterType => {
                switch (filterType) {
                    case 'httpOnly':
                        return cookie.httpOnly;
                    case 'secure':
                        return cookie.secure;
                    case 'session':
                        return !cookie.expirationDate;
                    case 'persistent':
                        return !!cookie.expirationDate;
                    case 'sameSiteNone':
                        return cookie.sameSite && cookie.sameSite.toLowerCase() === 'none';
                    case 'sameSiteLax':
                        return cookie.sameSite && cookie.sameSite.toLowerCase() === 'lax';
                    case 'sameSiteStrict':
                        return cookie.sameSite && cookie.sameSite.toLowerCase() === 'strict';
                    case 'noSameSite':
                        return !cookie.sameSite;
                    default:
                        return false;
                }
            });

            return matchesSearch && matchesFilters;
        });

        this.renderCookies();
    }

    renderCookies() {
        const cookieList = document.getElementById('cookieList');
        const noCookies = document.getElementById('noCookies');

        if (this.filteredCookies.length === 0) {
            cookieList.innerHTML = '';
            noCookies.style.display = 'block';
            return;
        }

        noCookies.style.display = 'none';
        
        cookieList.innerHTML = this.filteredCookies.map(cookie => {
            const badges = this.generateBadges(cookie);
            const details = this.generateDetails(cookie);
            
            return `
                <div class="cookie-item">
                    <div class="cookie-name">
                        ${this.escapeHtml(cookie.name)}
                        <div class="cookie-badges">${badges}</div>
                    </div>
                    <div class="cookie-value">${this.escapeHtml(cookie.value || '(empty)')}</div>
                    <div class="cookie-details">${details}</div>
                </div>
            `;
        }).join('');
    }

    generateBadges(cookie) {
        const badges = [];
        
        if (cookie.httpOnly) {
            badges.push('<span class="badge badge-httponly">HTTP-Only</span>');
        }
        
        if (cookie.secure) {
            badges.push('<span class="badge badge-secure">Secure</span>');
        }
        
        if (cookie.sameSite) {
            badges.push(`<span class="badge badge-samesite">${cookie.sameSite}</span>`);
        }
        
        return badges.join('');
    }

    generateDetails(cookie) {
        const details = [];
        
        details.push(`<span><strong>Domain:</strong> ${cookie.domain}</span>`);
        details.push(`<span><strong>Path:</strong> ${cookie.path}</span>`);
        
        if (cookie.expirationDate) {
            const expiry = new Date(cookie.expirationDate * 1000);
            details.push(`<span><strong>Expires:</strong> ${expiry.toLocaleString()}</span>`);
        } else {
            details.push(`<span><strong>Expires:</strong> Session</span>`);
        }
        
        return details.join('');
    }

    updateStats() {
        const totalCount = this.cookies.length;
        const httpOnlyCount = this.cookies.filter(cookie => cookie.httpOnly).length;
        const secureCount = this.cookies.filter(cookie => cookie.secure).length;
        const sessionCount = this.cookies.filter(cookie => !cookie.expirationDate).length;
        
        // Build status text similar to Finder
        let statusParts = [];
        
        if (totalCount === 0) {
            statusParts.push('No cookies');
        } else if (totalCount === 1) {
            statusParts.push('1 cookie');
        } else {
            statusParts.push(`${totalCount} cookies`);
        }
        
        // Add additional stats if there are cookies
        if (totalCount > 0) {
            const stats = [];
            
            if (httpOnlyCount > 0) {
                stats.push(`${httpOnlyCount} HTTP-only`);
            }
            
            if (secureCount > 0) {
                stats.push(`${secureCount} secure`);
            }
            
            if (sessionCount > 0) {
                stats.push(`${sessionCount} session`);
            }
            
            if (stats.length > 0) {
                statusParts.push(`(${stats.join(', ')})`);
            }
        }
        
        document.getElementById('statusText').textContent = statusParts.join(' ');
    }

    async clearAllCookies() {
        if (!confirm('Are you sure you want to clear all cookies for this domain? This action cannot be undone.')) {
            return;
        }

        try {
            if (!this.currentTab || !this.currentTab.url) {
                throw new Error('No active tab found');
            }

            const url = new URL(this.currentTab.url);
            
            // Remove all cookies for the current domain
            for (const cookie of this.cookies) {
                await chrome.cookies.remove({
                    url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
                    name: cookie.name
                });
            }
            
            // Reload cookies after clearing
            await this.loadCookies();
            
        } catch (error) {
            this.showError('Failed to clear cookies: ' + error.message);
        }
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
        document.getElementById('cookieList').style.display = show ? 'none' : 'block';
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    hideError() {
        document.getElementById('error').style.display = 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateBadge() {
        // Send message to background script to update badge
        chrome.runtime.sendMessage({
            action: 'updateBadge',
            tabId: this.currentTab?.id
        }).catch(() => {
            // Background script might not be ready, ignore error
        });
    }
}

// Initialize the cookie viewer when the popup loads
document.addEventListener('DOMContentLoaded', () => {
    new CookieViewer();
});
