const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');

// Set node-env
process.env.NODE_ENV = 'development';

// Check if env is "development"
const isDev = process.env.NODE_ENV !== 'production';
// Check ig this runs on Mac
const isMac = process.platform === 'darwin';

// Init MainWindow
let mainWindow;

// MainWindow Create & Config Fcn
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: isDev ? 800 : 500,
    x: isDev && 1120,
    y: isDev && 100,
    height: isDev ? 900 : 600,
    title: 'Awesome File Encrypter',
    resizable: isDev,
    backgroundColor: 'white',
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile('./app/index.html');
}

// Main app menu
const menu = [
  {
    role: 'fileMenu',
  },
  ...(isDev
    ? [
        {
          label: 'Developer',
          submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { type: 'separator' },
            { role: 'toggledevtools' },
          ],
        },
      ]
    : []),
];

app.on('ready', () => {
  createMainWindow();

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

  // Garbage Collection
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
});

// Mac Stuff
app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
