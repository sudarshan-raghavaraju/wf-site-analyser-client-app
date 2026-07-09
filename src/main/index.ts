import path from 'path';

import { app, BrowserWindow } from 'electron';

import { registerIpcHandlers } from './ipc';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: true,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  registerIpcHandlers();

  if (process.env.NODE_ENV === 'development' && process.env.ELECTRON_RENDERER_URL) {
    // electron-vite injects ELECTRON_RENDERER_URL with the actual allocated port
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    mainWindow.webContents.openDevTools({ mode: 'right' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      const { mockServer } = await import('./mocks/server');
      mockServer.listen({ onUnhandledRequest: 'bypass' });
      console.log('[dev] MSW mock server started — update-check requests intercepted.');
    } catch (err) {
      console.warn('[dev] MSW failed to start, requests will hit the real network:', err);
    }
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
