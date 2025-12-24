# Chrome Extension Build Workflow Setup

This document explains how to configure the GitHub Actions workflow for building and signing your Chrome extension.

## Required Repository Secrets

To use this workflow, you need to configure the following secrets in your GitHub repository:

### Required for CRX Signing
- `CHROME_EXTENSION_PRIVATE_KEY`: The private key used to sign your Chrome extension CRX file
  - Generate using: `openssl genrsa -out key.pem 2048`
  - Then get the private key content: `cat key.pem`
  - Copy the entire content including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

### Optional for Chrome Web Store Publishing
- `CHROME_EXTENSION_ID`: Your extension's ID from the Chrome Web Store
- `CHROME_WEBSTORE_CLIENT_ID`: OAuth2 client ID for Chrome Web Store API
- `CHROME_WEBSTORE_CLIENT_SECRET`: OAuth2 client secret for Chrome Web Store API  
- `CHROME_WEBSTORE_REFRESH_TOKEN`: OAuth2 refresh token for Chrome Web Store API

## How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the exact name listed above

## Workflow Triggers

The workflow runs on:
- Push to `main` or `master` branch
- Pull requests to `main` or `master` branch
- Git tags starting with `v` (e.g., `v1.0.0`)
- Manual trigger via GitHub Actions UI

## Workflow Outputs

### On Every Run
- **Artifacts**: `chrome-extension-artifacts` containing:
  - `cookie-viewer-extension.zip` - Unsigned extension package
  - `cookie-viewer-extension.crx` - Signed extension file

### On Tag Push (Release)
- **GitHub Release**: Automatically created with extension files
- **Chrome Web Store**: Extension uploaded as draft (if secrets configured)

## Generating a Private Key for CRX Signing

```bash
# Generate a private key
openssl genrsa -out extension-key.pem 2048

# Extract the public key (for reference)
openssl rsa -in extension-key.pem -pubout -out extension-public.pem

# View the private key content to copy to GitHub secrets
cat extension-key.pem
```

**Important**: Keep your private key secure and never commit it to your repository!

## Chrome Web Store API Setup (Optional)

To enable automatic publishing to Chrome Web Store:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Chrome Web Store API
4. Create OAuth2 credentials
5. Get your refresh token using the OAuth2 flow
6. Add the credentials as repository secrets

## Testing the Workflow

1. Make a change to your extension
2. Commit and push to trigger the workflow
3. Check the Actions tab to see the workflow run
4. Download the artifacts to test the signed CRX file

## Creating a Release

To create a release with automatic Chrome Web Store upload:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will trigger the release workflow that creates a GitHub release and uploads to Chrome Web Store.
