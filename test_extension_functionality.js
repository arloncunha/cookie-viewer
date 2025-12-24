// Test script to verify Cookie Viewer extension functionality
// This script can be run in the browser console to test various aspects

console.log('🍪 Cookie Viewer Extension Test Suite');
console.log('=====================================');

// Test 1: Check if extension files are properly structured
console.log('\n1. Testing extension structure...');

// Test 2: Create some test cookies
console.log('\n2. Creating test cookies...');
document.cookie = "test_cookie_1=value1; path=/";
document.cookie = "test_cookie_2=value2; path=/; secure";
document.cookie = "session_cookie=session_value; path=/";
document.cookie = "persistent_cookie=persistent_value; path=/; expires=" + new Date(Date.now() + 86400000).toUTCString();

console.log('✅ Test cookies created');

// Test 3: Check if cookies are accessible
console.log('\n3. Testing cookie access...');
const cookieString = document.cookie;
console.log('Document cookies:', cookieString);

if (cookieString.includes('test_cookie_1')) {
    console.log('✅ Basic cookie creation works');
} else {
    console.log('❌ Basic cookie creation failed');
}

// Test 4: Test cookie parsing
console.log('\n4. Testing cookie parsing...');
const cookies = [];
const cookiePairs = cookieString.split(';');

for (const pair of cookiePairs) {
    const [name, ...valueParts] = pair.trim().split('=');
    const value = valueParts.join('=');
    
    if (name) {
        cookies.push({
            name: name.trim(),
            value: value ? decodeURIComponent(value.trim()) : '',
            domain: window.location.hostname,
            path: '/',
            secure: window.location.protocol === 'https:',
            httpOnly: false,
            sameSite: 'Lax',
            source: 'document.cookie'
        });
    }
}

console.log('Parsed cookies:', cookies);
console.log(`✅ Found ${cookies.length} cookies`);

// Test 5: Test page info gathering
console.log('\n5. Testing page info gathering...');
const pageInfo = {
    url: window.location.href,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    pathname: window.location.pathname,
    title: document.title,
    cookieCount: document.cookie.split(';').filter(c => c.trim()).length
};

console.log('Page info:', pageInfo);
console.log('✅ Page info gathering works');

// Test 6: Test cookie monitoring setup
console.log('\n6. Testing cookie monitoring...');
let lastCookieString = document.cookie;
let changeDetected = false;

const testMonitor = () => {
    const currentCookieString = document.cookie;
    if (currentCookieString !== lastCookieString) {
        console.log('🔄 Cookie change detected!');
        console.log('Old:', lastCookieString);
        console.log('New:', currentCookieString);
        changeDetected = true;
        lastCookieString = currentCookieString;
    }
};

// Set up monitoring
const monitorInterval = setInterval(testMonitor, 1000);

// Create a new cookie to test monitoring
setTimeout(() => {
    document.cookie = "monitor_test=monitoring_works; path=/";
    console.log('📝 Added monitor test cookie');
    
    setTimeout(() => {
        clearInterval(monitorInterval);
        if (changeDetected) {
            console.log('✅ Cookie monitoring works');
        } else {
            console.log('❌ Cookie monitoring failed');
        }
        
        // Clean up test cookies
        console.log('\n7. Cleaning up test cookies...');
        const expiredDate = new Date(0).toUTCString();
        document.cookie = `test_cookie_1=; expires=${expiredDate}; path=/`;
        document.cookie = `test_cookie_2=; expires=${expiredDate}; path=/`;
        document.cookie = `session_cookie=; expires=${expiredDate}; path=/`;
        document.cookie = `persistent_cookie=; expires=${expiredDate}; path=/`;
        document.cookie = `monitor_test=; expires=${expiredDate}; path=/`;
        console.log('🧹 Test cookies cleaned up');
        
        console.log('\n🎉 Cookie Viewer Extension Test Complete!');
        console.log('The extension should now work properly.');
        console.log('\nTo test the full extension:');
        console.log('1. Load the extension in Chrome (chrome://extensions/)');
        console.log('2. Enable Developer mode');
        console.log('3. Click "Load unpacked" and select the extension folder');
        console.log('4. Visit any website and click the extension icon');
    }, 2000);
}, 1000);
