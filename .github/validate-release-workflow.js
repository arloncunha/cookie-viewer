#!/usr/bin/env node

/**
 * Validation script for Chrome Extension Release Workflow
 * This script validates the workflow configuration and checks for common issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Chrome Extension Release Workflow...\n');

// Check if required files exist
const requiredFiles = [
  'extension/manifest.json',
  '.github/workflows/build-and-sign.yml',
  'extension/popup.html',
  'extension/popup.js',
  'extension/background.js'
];

let allFilesExist = true;

console.log('📁 Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all extension files are present.');
  process.exit(1);
}

// Validate manifest.json
console.log('\n📋 Validating manifest.json:');
try {
  const manifestPath = 'extension/manifest.json';
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Check required fields
  const requiredFields = ['manifest_version', 'name', 'version', 'description'];
  requiredFields.forEach(field => {
    if (manifest[field]) {
      console.log(`  ✅ ${field}: ${manifest[field]}`);
    } else {
      console.log(`  ❌ ${field} - MISSING`);
    }
  });
  
  // Validate version format
  const versionRegex = /^\d+\.\d+(\.\d+)?$/;
  if (versionRegex.test(manifest.version)) {
    console.log(`  ✅ Version format is valid: ${manifest.version}`);
  } else {
    console.log(`  ⚠️  Version format may cause issues: ${manifest.version}`);
    console.log('     Recommended format: X.Y or X.Y.Z (e.g., 1.0 or 1.0.0)');
  }
  
} catch (error) {
  console.log(`  ❌ Error reading manifest.json: ${error.message}`);
  process.exit(1);
}

// Check workflow file
console.log('\n⚙️  Validating workflow file:');
try {
  const workflowContent = fs.readFileSync('.github/workflows/build-and-sign.yml', 'utf8');
  
  // Check for required secrets references
  const requiredSecrets = [
    'CHROME_EXTENSION_PRIVATE_KEY',
    'GITHUB_TOKEN'
  ];
  
  const optionalSecrets = [
    'CHROME_EXTENSION_ID',
    'CHROME_WEBSTORE_CLIENT_ID',
    'CHROME_WEBSTORE_CLIENT_SECRET',
    'CHROME_WEBSTORE_REFRESH_TOKEN'
  ];
  
  console.log('  Required secrets:');
  requiredSecrets.forEach(secret => {
    if (workflowContent.includes(`secrets.${secret}`)) {
      console.log(`    ✅ ${secret} - Referenced in workflow`);
    } else {
      console.log(`    ❌ ${secret} - NOT FOUND in workflow`);
    }
  });
  
  console.log('  Optional secrets (for Chrome Web Store):');
  optionalSecrets.forEach(secret => {
    if (workflowContent.includes(`secrets.${secret}`)) {
      console.log(`    ✅ ${secret} - Referenced in workflow`);
    } else {
      console.log(`    ⚠️  ${secret} - Not configured (Chrome Web Store upload disabled)`);
    }
  });
  
} catch (error) {
  console.log(`  ❌ Error reading workflow file: ${error.message}`);
  process.exit(1);
}

// Check for private key file (should NOT exist in repo)
console.log('\n🔐 Security check:');
const privateKeyFiles = ['key.pem', 'extension-key.pem', 'private-key.pem'];
let foundPrivateKey = false;

privateKeyFiles.forEach(keyFile => {
  if (fs.existsSync(keyFile)) {
    console.log(`  ⚠️  ${keyFile} found in repository - This should be in GitHub Secrets only!`);
    foundPrivateKey = true;
  }
});

if (!foundPrivateKey) {
  console.log('  ✅ No private key files found in repository (good!)');
}

// Check .gitignore
console.log('\n🚫 Checking .gitignore:');
if (fs.existsSync('.gitignore')) {
  const gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  const shouldIgnore = ['*.pem', '*.crx', 'build/', 'dist/'];
  
  shouldIgnore.forEach(pattern => {
    if (gitignoreContent.includes(pattern)) {
      console.log(`  ✅ ${pattern} - Properly ignored`);
    } else {
      console.log(`  ⚠️  ${pattern} - Consider adding to .gitignore`);
    }
  });
} else {
  console.log('  ⚠️  .gitignore not found - Consider creating one');
}

console.log('\n🎯 Release Workflow Summary:');
console.log('  • Workflow triggers on: push to main/master, tags (v*), PRs, manual dispatch');
console.log('  • Creates versioned artifacts: cookie-viewer-extension-{version}.zip/.crx');
console.log('  • Uploads artifacts to GitHub Actions for every build');
console.log('  • Creates GitHub releases automatically when you push version tags');
console.log('  • Supports pre-releases (alpha, beta, rc versions)');
console.log('  • Includes detailed installation instructions in release notes');

console.log('\n📝 Next Steps:');
console.log('  1. Ensure CHROME_EXTENSION_PRIVATE_KEY is set in GitHub repository secrets');
console.log('  2. To create a release, push a version tag: git tag v1.0.0 && git push origin v1.0.0');
console.log('  3. Optional: Configure Chrome Web Store secrets for automatic publishing');
console.log('  4. Test the workflow by pushing changes or creating a tag');

console.log('\n✅ Workflow validation completed!');
