# Cookie Viewer Chrome Extension

A Chrome extension that can view all cookies for any website, including HTTP-only cookies that are normally inaccessible to regular JavaScript.

## Features

- **View All Cookies**: Access both regular and HTTP-only cookies using Chrome's extension APIs
- **Real-time Updates**: Monitor cookie changes as they happen
- **Advanced Filtering**: Filter cookies by type (HTTP-only, secure, regular)
- **Search Functionality**: Search through cookies by name, value, or domain
- **Cookie Management**: Clear individual or all cookies for a domain
- **Detailed Information**: View cookie properties including domain, path, expiration, and security flags
- **Clean Interface**: Modern, responsive UI with intuitive design

## Key Capabilities

### HTTP-Only Cookie Access
Unlike regular web pages, this extension can access HTTP-only cookies through Chrome's `chrome.cookies` API. This is particularly useful for:
- Security analysis
- Development and debugging
- Understanding website cookie behavior
- Cookie auditing

### Cookie Properties Displayed
- Cookie name and value
- Domain and path
- Expiration date
- Security flags (HTTP-only, Secure, SameSite)
- Real-time statistics

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the `extension` folder from the repository
5. The Cookie Viewer extension will appear in your extensions list

### Usage

1. Navigate to any website
2. Click the Cookie Viewer extension icon in the toolbar
3. View all cookies for the current domain
4. Use the search bar to find specific cookies
5. Filter cookies by type using the dropdown menu
6. Click "Refresh" to update the cookie list
7. Click "Clear All" to remove all cookies for the domain

## Icon Design

The extension features a custom cookie icon that represents its functionality:

- **Design**: A stylized cookie icon with a clean, modern appearance
- **Format**: Available in multiple sizes (16x16, 48x48, 128x128 pixels) as PNG files
- **Source**: Original SVG source file (`cookie-icon.svg`) included for customization
- **Usage**: Displayed in the Chrome toolbar and extension management pages

The icon is designed to be easily recognizable and clearly communicate the extension's purpose of cookie management and analysis.

## Files Structure

```
cookie-viewer/
├── extension/            # Extension source code
│   ├── manifest.json     # Extension configuration
│   ├── popup.html        # Extension popup interface
│   ├── popup.css         # Styling for the popup
│   ├── popup.js          # Main popup functionality
│   ├── background.js     # Background service worker
│   ├── content.js        # Content script for web pages
│   ├── cookie-icon.svg   # Cookie icon source (SVG format)
│   ├── icon16.png        # 16x16 extension icon
│   ├── icon48.png        # 48x48 extension icon
│   └── icon128.png       # 128x128 extension icon
├── test_extension.js     # Extension testing utilities
├── LICENSE               # MIT License file
└── README.md             # This file
```

## Technical Details

### Permissions Required
- `cookies`: Access to Chrome's cookie API
- `activeTab`: Access to the current active tab
- `storage`: Store extension settings
- `<all_urls>`: Access cookies from all domains

### Architecture
- **Manifest V3**: Uses the latest Chrome extension manifest version
- **Service Worker**: Background script for cookie management
- **Content Script**: Monitors cookie changes on web pages
- **Popup Interface**: User-friendly interface for cookie viewing

### Security Considerations
This extension requires broad permissions to access cookies from all websites. It's designed for legitimate use cases such as:
- Web development and debugging
- Security research and analysis
- Cookie behavior understanding
- Privacy auditing

## Browser Compatibility

- Chrome 88+ (Manifest V3 support required)
- Chromium-based browsers with extension support

## Privacy

This extension:
- Does not transmit any cookie data to external servers
- Stores settings locally using Chrome's storage API
- Only accesses cookies when actively used
- Does not track user behavior

## Development

### Building from Source
No build process required - this is a pure JavaScript extension.

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This tool is intended for legitimate purposes such as web development, security research, and educational use. Users are responsible for ensuring their use complies with applicable laws, website terms of service, and privacy policies.
