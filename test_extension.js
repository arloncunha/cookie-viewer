// Test script to validate Chrome extension structure
// Run this with: node test_extension.js

const fs = require('fs');
const path = require('path');

class ExtensionValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.extensionDir = 'extension';
        this.requiredFiles = [
            'manifest.json',
            'popup.html',
            'popup.css',
            'popup.js',
            'background.js',
            'content.js',
            'icon16.png',
            'icon48.png',
            'icon128.png'
        ];
    }

    validateFiles() {
        console.log('🔍 Validating Chrome Extension Files...\n');
        
        // Check if extension directory exists
        if (!fs.existsSync(this.extensionDir)) {
            this.errors.push(`❌ Extension directory '${this.extensionDir}' not found`);
            return;
        }
        
        // Check if all required files exist
        for (const file of this.requiredFiles) {
            const filePath = path.join(this.extensionDir, file);
            if (fs.existsSync(filePath)) {
                console.log(`✅ ${file} - Found`);
            } else {
                this.errors.push(`❌ ${file} - Missing`);
            }
        }
    }

    validateManifest() {
        console.log('\n📋 Validating manifest.json...');
        
        try {
            const manifestPath = path.join(this.extensionDir, 'manifest.json');
            const manifestContent = fs.readFileSync(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestContent);
            
            // Check required manifest fields
            const requiredFields = ['manifest_version', 'name', 'version', 'permissions'];
            for (const field of requiredFields) {
                if (manifest[field]) {
                    console.log(`✅ ${field} - Present`);
                } else {
                    this.errors.push(`❌ manifest.json missing required field: ${field}`);
                }
            }
            
            // Check manifest version
            if (manifest.manifest_version === 3) {
                console.log('✅ Using Manifest V3');
            } else {
                this.warnings.push('⚠️  Not using Manifest V3');
            }
            
            // Check permissions
            if (manifest.permissions && manifest.permissions.includes('cookies')) {
                console.log('✅ Cookie permission granted');
            } else {
                this.errors.push('❌ Missing cookies permission');
            }
            
        } catch (error) {
            this.errors.push(`❌ Invalid manifest.json: ${error.message}`);
        }
    }

    validateHTML() {
        console.log('\n🌐 Validating HTML files...');
        
        try {
            const htmlPath = path.join(this.extensionDir, 'popup.html');
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            
            // Basic HTML validation
            if (htmlContent.includes('<!DOCTYPE html>')) {
                console.log('✅ popup.html has DOCTYPE');
            } else {
                this.warnings.push('⚠️  popup.html missing DOCTYPE');
            }
            
            if (htmlContent.includes('popup.css')) {
                console.log('✅ popup.html links to CSS');
            } else {
                this.warnings.push('⚠️  popup.html missing CSS link');
            }
            
            if (htmlContent.includes('popup.js')) {
                console.log('✅ popup.html links to JavaScript');
            } else {
                this.errors.push('❌ popup.html missing JavaScript link');
            }
            
        } catch (error) {
            this.errors.push(`❌ Error reading popup.html: ${error.message}`);
        }
    }

    validateJavaScript() {
        console.log('\n📜 Validating JavaScript files...');
        
        const jsFiles = ['popup.js', 'background.js', 'content.js'];
        
        for (const file of jsFiles) {
            try {
                const filePath = path.join(this.extensionDir, file);
                const jsContent = fs.readFileSync(filePath, 'utf8');
                
                // Basic syntax check (very simple)
                if (jsContent.includes('chrome.')) {
                    console.log(`✅ ${file} uses Chrome APIs`);
                } else {
                    this.warnings.push(`⚠️  ${file} doesn't seem to use Chrome APIs`);
                }
                
                // Check for basic structure
                if (file === 'popup.js' && jsContent.includes('CookieViewer')) {
                    console.log(`✅ ${file} has main class`);
                }
                
                if (file === 'background.js' && jsContent.includes('CookieManager')) {
                    console.log(`✅ ${file} has background service`);
                }
                
            } catch (error) {
                this.errors.push(`❌ Error reading ${file}: ${error.message}`);
            }
        }
    }

    validateIcons() {
        console.log('\n🎨 Validating icon files...');
        
        const iconSizes = [
            { file: 'icon16.png', expectedSize: 16 },
            { file: 'icon48.png', expectedSize: 48 },
            { file: 'icon128.png', expectedSize: 128 }
        ];
        
        for (const icon of iconSizes) {
            try {
                const iconPath = path.join(this.extensionDir, icon.file);
                const stats = fs.statSync(iconPath);
                if (stats.size > 0) {
                    console.log(`✅ ${icon.file} exists and has content (${stats.size} bytes)`);
                } else {
                    this.warnings.push(`⚠️  ${icon.file} is empty`);
                }
            } catch (error) {
                this.errors.push(`❌ ${icon.file} not accessible: ${error.message}`);
            }
        }
    }

    generateReport() {
        console.log('\n' + '='.repeat(50));
        console.log('🎉 Extension validation complete!');
    }

    run() {
        this.validateFiles();
        this.validateHTML();
        this.validateJavaScript();
        this.validateIcons();
        this.validateManifest();
        this.generateReport();
    }
}

// Run the validator
const validator = new ExtensionValidator();
validator.run();
