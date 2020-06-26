const path = require('path');
const fs = require('fs');
const os = require('os');
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const CryptoJS = require('crypto-js');

// Set node-env
process.env.NODE_ENV = 'production';

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

const userHomeDirectory = os.homedir();
const savePath = path.join(userHomeDirectory, 'awesome-file-encrypter');

ipcMain.on(
  'encrypt',
  (e, filePath, password, fileNameWithoutExtension, fileExtension) => {
    let originalContent = fs.readFileSync(filePath).toString();

    // Add original file-extension to end of file content for decryption
    originalContent += `{{fileExtension:${fileExtension}}}`;

    try {
      const encryptedContent = CryptoJS.AES.encrypt(
        originalContent,
        password,
      ).toString();

      !fs.existsSync(savePath) && fs.mkdirSync(savePath);

      fs.writeFileSync(
        path.join(savePath, `${fileNameWithoutExtension}.secret`),
        encryptedContent,
      );

      shell.openPath(savePath);
    } catch (error) {
      mainWindow.webContents.send('alert', error.message);
    }

    mainWindow.webContents.send('alert', 'File successfully encrypted');
  },
);

ipcMain.on('decrypt', (e, filePath, password, fileNameWithoutExtension) => {
  const encryptedContent = fs.readFileSync(filePath).toString();

  let decryptedContent;

  try {
    decryptedContent = CryptoJS.AES.decrypt(
      encryptedContent,
      password,
    ).toString(CryptoJS.enc.Utf8);

    // Get file-extension that has been added to the file during encryption and delete it from file
    const fileExtension = decryptedContent
      .substring(decryptedContent.search(/{{(?:.*)}}/), decryptedContent.length)
      .replace('{{', '')
      .replace('}}', '')
      .split(':')[1];

    decryptedContent = decryptedContent.replace(/{{(?:.*)}}/, '');

    !fs.existsSync(savePath) && fs.mkdirSync(savePath);

    fs.writeFileSync(
      path.join(savePath, `${fileNameWithoutExtension}.${fileExtension}`),
      decryptedContent,
    );

    shell.openPath(savePath);
  } catch (error) {
    mainWindow.webContents.send('alert', error.message);
  }

  mainWindow.webContents.send('alert', 'File successfully decrypted');
});
