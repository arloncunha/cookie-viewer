// Content script for Cookie Viewer Chrome Extension
// This script runs on web pages and provides additional cookie reading capabilities

class ContentCookieViewer {
    constructor() {
        this.init();
    }

    init() {
        // Listen for messages from popup or background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Monitor cookie changes on the page
        this.monitorCookieChanges();
    }

    handleMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'getDocumentCookies':
                    const cookies = this.getDocumentCookies();
                    sendResponse({ success: true, cookies });
                    break;

                case 'injectCookieMonitor':
                    this.injectCookieMonitor();
                    sendResponse({ success: true });
                    break;

                case 'getPageInfo':
                    const pageInfo = this.getPageInfo();
                    sendResponse({ success: true, pageInfo });
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Content script error:', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    getDocumentCookies() {
        // Get cookies that are accessible via document.cookie
        // Note: This will NOT include HTTP-only cookies
        const cookieString = document.cookie;
        
        if (!cookieString) {
            return [];
        }

        const cookies = [];
        const cookiePairs = cookieString.split(';');

        for (const pair of cookiePairs) {
            const [name, ...valueParts] = pair.trim().split('=');
            const value = valueParts.join('='); // Handle values that contain '='
            
            if (name) {
                cookies.push({
                    name: name.trim(),
                    value: value ? decodeURIComponent(value.trim()) : '',
                    domain: window.location.hostname,
                    path: '/',
                    secure: window.location.protocol === 'https:',
                    httpOnly: false, // document.cookie can't access HTTP-only cookies
                    sameSite: 'Lax', // Default assumption
                    source: 'document.cookie'
                });
            }
        }

        return cookies;
    }

    getPageInfo() {
        return {
            url: window.location.href,
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            pathname: window.location.pathname,
            title: document.title,
            cookieCount: document.cookie.split(';').filter(c => c.trim()).length
        };
    }

    monitorCookieChanges() {
        // Store initial cookie state
        let lastCookieString = document.cookie;

        // Check for cookie changes periodically
        const checkInterval = setInterval(() => {
            const currentCookieString = document.cookie;
            
            if (currentCookieString !== lastCookieString) {
                this.onCookieChange(lastCookieString, currentCookieString);
                lastCookieString = currentCookieString;
            }
        }, 1000); // Check every second

        // Clean up interval when page unloads
        window.addEventListener('beforeunload', () => {
            clearInterval(checkInterval);
        });
    }

    onCookieChange(oldCookies, newCookies) {
        // Notify background script about cookie changes
        chrome.runtime.sendMessage({
            action: 'documentCookieChanged',
            oldCookies: oldCookies,
            newCookies: newCookies,
            url: window.location.href
        }).catch(() => {
            // Background script might not be ready, ignore error
        });
    }

    injectCookieMonitor() {
        // Inject a more sophisticated cookie monitor into the page
        const script = document.createElement('script');
        script.textContent = `
            (function() {
                // Override document.cookie to monitor changes
                const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
                                                Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
                
                if (originalCookieDescriptor && originalCookieDescriptor.configurable) {
                    Object.defineProperty(document, 'cookie', {
                        get: function() {
                            return originalCookieDescriptor.get.call(this);
                        },
                        set: function(value) {
                            // Notify about cookie being set
                            window.postMessage({
                                type: 'COOKIE_SET',
                                cookie: value,
                                timestamp: Date.now()
                            }, '*');
                            
                            return originalCookieDescriptor.set.call(this, value);
                        },
                        configurable: true
                    });
                }

                // Monitor fetch requests that might set cookies
                const originalFetch = window.fetch;
                window.fetch = function(...args) {
                    return originalFetch.apply(this, args).then(response => {
                        if (response.headers.has('set-cookie')) {
                            window.postMessage({
                                type: 'FETCH_COOKIE_SET',
                                url: args[0],
                                timestamp: Date.now()
                            }, '*');
                        }
                        return response;
                    });
                };

                // Monitor XMLHttpRequest
                const originalXHROpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(...args) {
                    this.addEventListener('readystatechange', function() {
                        if (this.readyState === 4) {
                            const setCookieHeader = this.getResponseHeader('set-cookie');
                            if (setCookieHeader) {
                                window.postMessage({
                                    type: 'XHR_COOKIE_SET',
                                    url: args[1],
                                    timestamp: Date.now()
                                }, '*');
                            }
                        }
                    });
                    return originalXHROpen.apply(this, args);
                };
            })();
        `;
        
        document.documentElement.appendChild(script);
        script.remove();

        // Listen for messages from the injected script
        window.addEventListener('message', (event) => {
            if (event.source !== window) return;
            
            if (event.data.type && event.data.type.includes('COOKIE')) {
                // Forward cookie-related messages to background script
                chrome.runtime.sendMessage({
                    action: 'cookieActivity',
                    data: event.data,
                    url: window.location.href
                }).catch(() => {
                    // Background script might not be ready, ignore error
                });
            }
        });
    }
}

// Initialize the content cookie viewer
new ContentCookieViewer();
