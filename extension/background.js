// Background script for Cookie Viewer Chrome Extension
// This service worker handles extension lifecycle and provides additional cookie management

class CookieManager {
    constructor() {
        this.init();
    }

    init() {
        // Listen for extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            console.log('Cookie Viewer extension installed:', details.reason);
            
            if (details.reason === 'install') {
                this.onFirstInstall();
            } else if (details.reason === 'update') {
                this.onUpdate(details.previousVersion);
            }
        });

        // Listen for messages from popup or content scripts
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Listen for cookie changes to provide real-time updates
        chrome.cookies.onChanged.addListener((changeInfo) => {
            this.onCookieChanged(changeInfo);
        });

        // Listen for tab updates to refresh cookie data
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.url) {
                this.onTabUpdated(tabId, tab);
            }
        });

        // Listen for tab activation to update badge
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.updateBadgeForTab(activeInfo.tabId);
        });

        // Listen for window focus changes
        chrome.windows.onFocusChanged.addListener((windowId) => {
            if (windowId !== chrome.windows.WINDOW_ID_NONE) {
                this.updateBadgeForActiveTab();
            }
        });
    }

    onFirstInstall() {
        console.log('Cookie Viewer: First time installation');
        
        // Set default settings
        chrome.storage.sync.set({
            autoRefresh: true,
            showNotifications: false,
            defaultFilter: 'all'
        });

        // Initialize badge for current active tab
        this.updateBadgeForActiveTab();
    }

    onUpdate(previousVersion) {
        console.log(`Cookie Viewer: Updated from version ${previousVersion}`);
        
        // Handle version-specific updates if needed
        if (this.compareVersions(previousVersion, '1.0') < 0) {
            // Migration logic for versions before 1.0
            this.migrateToV1();
        }
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'getCookies':
                    const cookies = await this.getCookiesForUrl(message.url);
                    sendResponse({ success: true, cookies });
                    break;

                case 'clearCookies':
                    const result = await this.clearCookiesForDomain(message.domain);
                    sendResponse({ success: true, cleared: result });
                    break;

                case 'exportCookies':
                    const exportData = await this.exportCookies(message.url);
                    sendResponse({ success: true, data: exportData });
                    break;

                case 'getSettings':
                    const settings = await this.getSettings();
                    sendResponse({ success: true, settings });
                    break;

                case 'saveSettings':
                    await this.saveSettings(message.settings);
                    sendResponse({ success: true });
                    break;

                case 'updateBadge':
                    if (message.tabId) {
                        await this.updateBadgeForTab(message.tabId);
                    } else {
                        await this.updateBadgeForActiveTab();
                    }
                    sendResponse({ success: true });
                    break;

                case 'documentCookieChanged':
                    // Handle cookie change notifications from content script
                    console.log('Document cookie changed:', message);
                    this.updateBadgeForActiveTab();
                    sendResponse({ success: true });
                    break;

                case 'cookieActivity':
                    // Handle cookie activity notifications from content script
                    console.log('Cookie activity detected:', message.data);
                    this.updateBadgeForActiveTab();
                    sendResponse({ success: true });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Background script error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    async getCookiesForUrl(url) {
        try {
            const urlObj = new URL(url);
            
            // Get cookies for the domain
            const domainCookies = await chrome.cookies.getAll({ domain: urlObj.hostname });
            
            // Get cookies for the specific URL
            const urlCookies = await chrome.cookies.getAll({ url: url });
            
            // Combine and deduplicate
            const cookieMap = new Map();
            [...domainCookies, ...urlCookies].forEach(cookie => {
                const key = `${cookie.name}-${cookie.domain}-${cookie.path}`;
                cookieMap.set(key, cookie);
            });
            
            return Array.from(cookieMap.values());
        } catch (error) {
            console.error('Error getting cookies:', error);
            throw error;
        }
    }

    async clearCookiesForDomain(domain) {
        try {
            const cookies = await chrome.cookies.getAll({ domain: domain });
            let clearedCount = 0;
            
            for (const cookie of cookies) {
                try {
                    await chrome.cookies.remove({
                        url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
                        name: cookie.name
                    });
                    clearedCount++;
                } catch (error) {
                    console.warn(`Failed to remove cookie ${cookie.name}:`, error);
                }
            }
            
            return clearedCount;
        } catch (error) {
            console.error('Error clearing cookies:', error);
            throw error;
        }
    }

    async exportCookies(url) {
        try {
            const cookies = await this.getCookiesForUrl(url);
            
            const exportData = {
                url: url,
                timestamp: new Date().toISOString(),
                cookies: cookies.map(cookie => ({
                    name: cookie.name,
                    value: cookie.value,
                    domain: cookie.domain,
                    path: cookie.path,
                    secure: cookie.secure,
                    httpOnly: cookie.httpOnly,
                    sameSite: cookie.sameSite,
                    expirationDate: cookie.expirationDate
                }))
            };
            
            return exportData;
        } catch (error) {
            console.error('Error exporting cookies:', error);
            throw error;
        }
    }

    async getSettings() {
        return new Promise((resolve) => {
            chrome.storage.sync.get({
                autoRefresh: true,
                showNotifications: false,
                defaultFilter: 'all'
            }, (settings) => {
                resolve(settings);
            });
        });
    }

    async saveSettings(settings) {
        return new Promise((resolve) => {
            chrome.storage.sync.set(settings, () => {
                resolve();
            });
        });
    }

    onCookieChanged(changeInfo) {
        // Notify popup if it's open about cookie changes
        chrome.runtime.sendMessage({
            action: 'cookieChanged',
            changeInfo: changeInfo
        }).catch(() => {
            // Popup might not be open, ignore error
        });

        // Update badge when cookies change
        this.updateBadgeForActiveTab();
    }

    onTabUpdated(tabId, tab) {
        // Update badge when tab is updated
        this.updateBadgeForTab(tabId);
    }

    async updateBadgeForActiveTab() {
        try {
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (activeTab) {
                await this.updateBadgeForTab(activeTab.id);
            }
        } catch (error) {
            console.error('Error updating badge for active tab:', error);
        }
    }

    async updateBadgeForTab(tabId) {
        try {
            const tab = await chrome.tabs.get(tabId);
            if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                // Clear badge for chrome:// pages and extension pages
                chrome.action.setBadgeText({ text: '', tabId: tabId });
                return;
            }

            const cookieCount = await this.getCookieCountForUrl(tab.url);
            const badgeText = cookieCount > 0 ? cookieCount.toString() : '';
            
            chrome.action.setBadgeText({ 
                text: badgeText, 
                tabId: tabId 
            });
            
            chrome.action.setBadgeBackgroundColor({ 
                color: cookieCount > 0 ? '#4CAF50' : '#757575',
                tabId: tabId 
            });
            
        } catch (error) {
            console.error('Error updating badge for tab:', error);
            // Clear badge on error
            chrome.action.setBadgeText({ text: '', tabId: tabId });
        }
    }

    async getCookieCountForUrl(url) {
        try {
            const urlObj = new URL(url);
            
            // Get cookies for the domain
            const domainCookies = await chrome.cookies.getAll({ domain: urlObj.hostname });
            
            // Get cookies for the specific URL
            const urlCookies = await chrome.cookies.getAll({ url: url });
            
            // Combine and deduplicate
            const cookieMap = new Map();
            [...domainCookies, ...urlCookies].forEach(cookie => {
                const key = `${cookie.name}-${cookie.domain}-${cookie.path}`;
                cookieMap.set(key, cookie);
            });
            
            return cookieMap.size;
        } catch (error) {
            console.error('Error getting cookie count:', error);
            return 0;
        }
    }

    compareVersions(version1, version2) {
        const v1parts = version1.split('.').map(Number);
        const v2parts = version2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
            const v1part = v1parts[i] || 0;
            const v2part = v2parts[i] || 0;
            
            if (v1part < v2part) return -1;
            if (v1part > v2part) return 1;
        }
        
        return 0;
    }

    migrateToV1() {
        console.log('Migrating to version 1.0');
        // Add any migration logic here
    }
}

// Initialize the cookie manager
new CookieManager();
