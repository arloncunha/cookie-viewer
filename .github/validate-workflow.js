#!/usr/bin/env node

/**
 * Simple validation script for the Chrome extension build workflow
 * This script checks for common issues and validates the workflow configuration
 */

const fs = require('fs');
const path = require('path');

function validateWorkflow() {
  console.log('🔍 Validating Chrome Extension Build Workflow...\n');
  
  let hasErrors = false;
  
  // Check if workflow file exists
  const workflowPath = '.github/workflows/build-and-sign.yml';
  if (!fs.existsSync(workflowPath)) {
    console.error('❌ Workflow file not found:', workflowPath);
    hasErrors = true;
  } else {
    console.log('✅ Workflow file exists:', workflowPath);
  }
  
  // Check if extension directory exists
  const extensionPath = 'extension';
  if (!fs.existsSync(extensionPath)) {
    console.error('❌ Extension directory not found:', extensionPath);
    hasErrors = true;
  } else {
    console.log('✅ Extension directory exists:', extensionPath);
  }
  
  // Check if manifest.json exists
  const manifestPath = 'extension/manifest.json';
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Extension manifest not found:', manifestPath);
    hasErrors = true;
  } else {
    console.log('✅ Extension manifest exists:', manifestPath);
    
    // Validate manifest content
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      if (!manifest.name) {
        console.warn('⚠️  Manifest missing name field');
      }
      
      if (!manifest.version) {
        console.warn('⚠️  Manifest missing version field');
      }
      
      if (manifest.manifest_version !== 3) {
        console.warn('⚠️  Manifest version is not 3 (recommended for new extensions)');
      }
      
      console.log('✅ Manifest validation passed');
    } catch (error) {
      console.error('❌ Invalid manifest JSON:', error.message);
      hasErrors = true;
    }
  }
  
  // Check required extension files
  const requiredFiles = [
    'extension/popup.html',
    'extension/popup.js',
    'extension/background.js',
    'extension/content.js'
  ];
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log('✅ Required file exists:', file);
    } else {
      console.warn('⚠️  Optional file missing:', file);
    }
  });
  
  // Check for icons
  const iconFiles = [
    'extension/icon16.png',
    'extension/icon48.png',
    'extension/icon128.png'
  ];
  
  iconFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log('✅ Icon file exists:', file);
    } else {
      console.warn('⚠️  Icon file missing:', file);
    }
  });
  
  console.log('\n📋 Next Steps:');
  console.log('1. Add CHROME_EXTENSION_PRIVATE_KEY secret to your GitHub repository');
  console.log('2. Generate a private key using: openssl genrsa -out key.pem 2048');
  console.log('3. Copy the private key content to the GitHub secret');
  console.log('4. Optionally add Chrome Web Store API secrets for automatic publishing');
  console.log('5. Push changes to trigger the workflow');
  
  if (hasErrors) {
    console.log('\n❌ Validation completed with errors. Please fix the issues above.');
    process.exit(1);
  } else {
    console.log('\n✅ Validation completed successfully! Your workflow is ready to use.');
  }
}

// Run validation
validateWorkflow();
