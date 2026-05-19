import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false, // frameless window
    transparent: true, // transparent background
    resizable: false, // Keep it simple and fixed size like the screenshot
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    // Note: this assumes Vite builds to dist/index.html
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Allow opening DevTools for debugging if needed
  // win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
  createWindow();

  // IPC event to close the window from the React app
  ipcMain.on('close-app', () => {
    app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
