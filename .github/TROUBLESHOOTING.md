# 🔧 Troubleshooting Chrome Extension Release Workflow

This guide helps resolve common issues with the GitHub Actions workflow for Chrome extension releases.

## 🚨 Common Issues

### 403 Error: GitHub Release Failed

**Error Messages:**
```
⚠️ GitHub release failed with status: 403
Resource not accessible by integration
```

**Causes & Solutions:**

#### 1. Repository Permissions Issue
The repository may not have the correct permissions configured.

**Solution:**
- Go to your repository Settings → Actions → General
- Under "Workflow permissions", select "Read and write permissions"
- Check "Allow GitHub Actions to create and approve pull requests"
- Save the changes

#### 2. GITHUB_TOKEN Permissions
The default GITHUB_TOKEN may not have sufficient permissions.

**Solution:**
The workflow has been updated with explicit permissions:
```yaml
permissions:
  contents: write
  actions: read
  checks: write
```

#### 3. Branch Protection Rules
Branch protection rules may prevent the workflow from creating releases.

**Solution:**
- Go to Settings → Branches
- Check if branch protection rules are blocking the action
- Add "github-actions[bot]" to the list of users who can bypass restrictions

#### 4. Organization/Enterprise Restrictions
Your organization may have restrictions on GitHub Actions.

**Solution:**
- Contact your organization admin
- Ensure the repository has permission to use GitHub Actions
- Check if third-party actions are allowed


### CRX Signing Failed

**Error Message:**
```
Error: Private key is required
```

**Solution:**
1. Generate a private key:
   ```bash
   openssl genrsa -out extension-key.pem 2048
   ```

2. Add the private key to GitHub Secrets:
   - Go to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CHROME_EXTENSION_PRIVATE_KEY`
   - Value: Copy the entire content of the .pem file (including headers)

3. **Important:** Do NOT commit the .pem file to your repository!

### Workflow Not Triggering

**Issue:** Workflow doesn't run when pushing tags.

**Solutions:**

#### 1. Check Tag Format
Tags must start with 'v':
```bash
# ✅ Correct
git tag v1.0.0

# ❌ Incorrect
git tag 1.0.0
```

#### 2. Push Tags to Remote
```bash
git push origin v1.0.0
```

#### 3. Check Workflow File Location
Ensure the workflow file is at:
```
.github/workflows/build-and-sign.yml
```

### Chrome Web Store Upload Failed

**Error Messages:**
- `Invalid extension ID`
- `Authentication failed`
- `Invalid refresh token`

**Solutions:**

#### 1. Extension ID
- Get your extension ID from the Chrome Web Store Developer Dashboard
- It looks like: `abcdefghijklmnopqrstuvwxyzabcdef`
- Add it as `CHROME_EXTENSION_ID` secret

#### 2. API Credentials
Follow the [Chrome Web Store API setup guide](https://developer.chrome.com/docs/webstore/using_webstore_api/):

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable Chrome Web Store API
4. Create OAuth2 credentials
5. Get refresh token
6. Add all credentials as repository secrets

### Artifacts Not Found

**Error Message:**
```
Error: No files were found with the provided path
```

**Solution:**
Check that all extension files exist:
```
extension/
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── content.js
└── icons/
```

### Version Mismatch

**Issue:** Release version doesn't match manifest version.

**Solution:**
1. Update `extension/manifest.json`:
   ```json
   {
     "version": "1.2.0"
   }
   ```

2. Create matching tag:
   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```

## 🔍 Debugging Steps

### 1. Run Validation Script
```bash
node .github/validate-release-workflow.js
```

This checks:
- Required files exist
- Manifest.json is valid
- Workflow configuration
- Security issues

### 2. Check GitHub Actions Logs
1. Go to your repository
2. Click "Actions" tab
3. Click on the failed workflow run
4. Expand the failed step to see detailed logs

### 3. Test Locally
Build the extension locally to ensure it works:
```bash
# Create build directory
mkdir -p build
cp -r extension/* build/

# Test zip creation
cd build
zip -r ../test-extension.zip .
cd ..
```

### 4. Verify Secrets
Check that all required secrets are set:
- Go to Settings → Secrets and variables → Actions
- Verify these secrets exist:
  - `CHROME_EXTENSION_PRIVATE_KEY` (required)
  - `CHROME_EXTENSION_ID` (optional)
  - `CHROME_WEBSTORE_CLIENT_ID` (optional)
  - `CHROME_WEBSTORE_CLIENT_SECRET` (optional)
  - `CHROME_WEBSTORE_REFRESH_TOKEN` (optional)

## 🛠️ Manual Release Creation

If the automated workflow fails, you can create releases manually:

### 1. Build Extension
```bash
mkdir -p build
cp -r extension/* build/
cd build
zip -r ../cookie-viewer-extension.zip .
cd ..
```

### 2. Sign Extension (if you have the private key)
```bash
# This requires Chrome or chromium-browser installed
# Alternative: Use online CRX packaging tools
```

### 3. Create GitHub Release
1. Go to your repository
2. Click "Releases"
3. Click "Create a new release"
4. Choose your tag
5. Upload the ZIP file
6. Add release notes

## 📞 Getting Help

### 1. Check Workflow Status
- Repository → Actions tab
- Look for failed workflows
- Check the logs for specific error messages

### 2. Validate Configuration
```bash
node .github/validate-release-workflow.js
```

### 3. Test with Simple Tag
Try creating a simple release:
```bash
git tag v0.0.1-test
git push origin v0.0.1-test
```

### 4. Repository Settings Checklist
- [ ] Actions are enabled
- [ ] Workflow permissions set to "Read and write"
- [ ] Required secrets are configured
- [ ] No branch protection blocking actions
- [ ] Third-party actions are allowed (if in organization)

## 🔄 Recovery Steps

If you need to retry a failed release:

1. **Delete the failed tag** (if it was created):
   ```bash
   git tag -d v1.0.0
   git push origin :refs/tags/v1.0.0
   ```

2. **Fix the issue** (permissions, secrets, etc.)

3. **Recreate and push the tag**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

5. **Monitor the workflow** in the Actions tab


## 📋 Quick Checklist

Before creating a release, ensure:
- [ ] Extension files are complete and valid
- [ ] Manifest.json version is updated
- [ ] Private key secret is configured
- [ ] Repository has write permissions for Actions
- [ ] Tag format is correct (starts with 'v')
- [ ] Validation script passes
- [ ] No branch protection blocking the workflow

This should resolve most common issues with the Chrome extension release workflow!
