# 🚀 Chrome Extension Release Guide

This guide explains how to create releases for your Chrome extension using the automated GitHub Actions workflow.

## Quick Start

### 1. Update Extension Version
First, update the version in your `extension/manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "Cookie Viewer",
  "version": "1.1.0",
  ...
}
```

### 2. Create and Push a Version Tag
```bash
# Create a tag matching your manifest version
git tag v1.1.0

# Push the tag to trigger the release
git push origin v1.1.0
```

### 3. Automatic Release Process
The workflow will automatically:
- ✅ Build your extension
- ✅ Create versioned artifacts (`cookie-viewer-extension-1.1.0.zip`)
- ✅ Create a GitHub release with detailed installation instructions
- ✅ Upload to Chrome Web Store as draft (if configured)

## Release Types

### 🟢 Stable Release
```bash
git tag v1.0.0
git push origin v1.0.0
```
Creates a standard release marked as "Latest"

### 🟡 Pre-release (Beta)
```bash
git tag v1.1.0-beta.1
git push origin v1.1.0-beta.1
```
Creates a pre-release marked as "Pre-release"

### 🟠 Pre-release (Alpha)
```bash
git tag v1.2.0-alpha.1
git push origin v1.2.0-alpha.1
```
Creates a pre-release for early testing

### 🔵 Release Candidate
```bash
git tag v1.0.0-rc.1
git push origin v1.0.0-rc.1
```
Creates a release candidate for final testing

## What Gets Released

Each release includes:

### 📦 Extension Files
- **`cookie-viewer-extension-{version}.zip`** - Extension package for manual installation

### 📋 Release Notes
Automatically generated with:
- Installation instructions for all methods
- Extension features and capabilities
- Version information and build metadata
- Direct download links

### 🏪 Chrome Web Store (Optional)
If configured, the extension is automatically uploaded as a draft to the Chrome Web Store.

## Installation Methods for Users

Your releases will include instructions for two installation methods:

### Method 1: Chrome Web Store (Recommended)
Direct installation from the Chrome Web Store (if published).

### Method 2: Developer Mode (ZIP)
1. Download the ZIP file
2. Extract to a folder
3. Load unpacked in Chrome extensions

## Validation Before Release

Always run the validation script before creating a release:

```bash
node .github/validate-release-workflow.js
```

This ensures:
- All required files are present
- Manifest.json is valid
- Workflow is properly configured
- No security issues (private keys in repo)

## Troubleshooting

### Release Not Created
- ✅ Check that you pushed the tag: `git push origin v1.0.0`
- ✅ Verify tag format starts with 'v': `v1.0.0` not `1.0.0`
- ✅ Check GitHub Actions tab for workflow errors

### Chrome Web Store Upload Failed
- ✅ Verify all Chrome Web Store secrets are configured
- ✅ Check extension ID matches your Web Store listing
- ✅ Ensure OAuth tokens are valid and not expired

## Best Practices

### 🎯 Version Numbering
- Use semantic versioning: `MAJOR.MINOR.PATCH`
- Increment MAJOR for breaking changes
- Increment MINOR for new features
- Increment PATCH for bug fixes

### 🔄 Release Workflow
1. Develop and test changes locally
2. Update version in manifest.json
3. Commit changes to main branch
4. Create and push version tag
5. Monitor GitHub Actions for successful build
6. Test the released artifacts
7. Publish from draft in Chrome Web Store (if applicable)

### 🛡️ Security
- Never commit private keys to the repository
- Use GitHub Secrets for all sensitive data
- Regularly rotate Chrome Web Store API tokens
- Review release artifacts before publishing

## Example Release Process

```bash
# 1. Update manifest.json version to 1.2.0
# 2. Commit and push changes
git add extension/manifest.json
git commit -m "Bump version to 1.2.0"
git push origin main

# 3. Create and push release tag
git tag v1.2.0
git push origin v1.2.0

# 4. Check GitHub Actions for successful build
# 5. Review the created release on GitHub
# 6. Test the downloaded artifacts
# 7. Publish from Chrome Web Store if needed
```

## Support

If you encounter issues with the release process:
1. Check the [Workflow Setup Guide](.github/WORKFLOW_SETUP.md)
2. Run the validation script
3. Review GitHub Actions logs
4. Check repository secrets configuration
