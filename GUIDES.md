## 3. How to Publish the Project

Once the configurations are saved, follow these steps to publish your package to the public npm registry:

### Step 1: Log in to npm
Open your terminal and log in to your npm account. If you do not have one, register first on [npmjs.com](https://www.npmjs.com/).
```bash
npm login
```
*It will prompt you for your username, password, email, and one-time password (OTP).*

### Step 2: Build and Test Packaging (Highly Recommended)
Before uploading, verify exactly what files will be included in the tarball sent to npm. You can generate a preview pack without publishing by running:
```bash
npm pack
```
This runs your `"prepublishOnly"` script (which builds your assets) and generates a file named `vite-plugin-kapar-0.1.0.tgz`. You can extract this file or inspect its contents to ensure `dist/index.js` and `dist/client.js` are present and correct.

### Step 3: Publish the Package
Publish your package to the registry:
```bash
npm publish
```
*If your package name is scoped (e.g., `@username/vite-plugin-kapar`), you may need to append the access flag:*
```bash
npm publish --access public
```

Once successful, your Vite plugin will be publicly available for developers to install.
