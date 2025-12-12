# How to Run Personal Finance Tracker

## The Problem

Firebase requires your application to run on a web server (http:// or https://), not directly from the file system (file://). This is why you're seeing the network error.

## Solution: Run a Local Web Server

### Option 1: Using the Batch File (Easiest)

1. **Double-click** `START_SERVER.bat` in this folder
2. A command window will open showing the server is running
3. Your browser will automatically open to `http://localhost:8000`
4. To stop the server, press `Ctrl+C` in the command window

### Option 2: Using Python Manually

1. Open Command Prompt or PowerShell
2. Navigate to this folder:
   ```bash
   cd C:\Users\HP\Downloads\Personal_Finance_Tracker
   ```
3. Start the server:
   ```bash
   python -m http.server 8000
   ```
4. Open your browser to: `http://localhost:8000`

### Option 3: Using Node.js (if you have it installed)

1. Install http-server globally:
   ```bash
   npm install -g http-server
   ```
2. Navigate to this folder and run:
   ```bash
   http-server -p 8000
   ```
3. Open your browser to: `http://localhost:8000`

### Option 4: Using VS Code Live Server

1. Open this folder in VS Code
2. Install the "Live Server" extension
3. Right-click on `index.html`
4. Select "Open with Live Server"

## After Starting the Server

1. Navigate to `http://localhost:8000/index.html`
2. Create an account or sign in
3. The Firebase error should be resolved!

## Troubleshooting

**Error: Python is not recognized**
- Install Python from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation

**Port 8000 already in use**
- Change the port number in the command:
  ```bash
  python -m http.server 8080
  ```
- Then open `http://localhost:8080`

**Still getting Firebase errors**
- Check your internet connection
- Verify Firebase configuration in `firebase-config.js`
- Check browser console for specific error messages

## Important Notes

- Keep the server running while using the application
- Don't close the command window
- The server only runs locally on your computer
- No one else can access it unless you configure port forwarding

## For Production Deployment

When ready to deploy, consider these free hosting options:
- **Firebase Hosting** (Recommended - integrates perfectly)
- **Netlify**
- **Vercel**
- **GitHub Pages**

See the main README.md for deployment instructions.
