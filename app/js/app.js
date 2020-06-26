const { ipcRenderer } = require('electron');

const form = document.querySelector('#file-form');
const file = document.querySelector('#file');
const password = document.querySelector('#password');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const uploadedFile = file.files[0];
  const filePath = uploadedFile.path;
  const fileName = uploadedFile.name;
  const fileNameWithoutExtension = fileName.split('.')[0];
  const fileExtension = fileName.split('.')[1];

  fileExtension === 'secret'
    ? ipcRenderer.send(
        'decrypt',
        filePath,
        password.value,
        fileNameWithoutExtension,
      )
    : ipcRenderer.send(
        'encrypt',
        filePath,
        password.value,
        fileNameWithoutExtension,
        fileExtension,
      );

  file.value = '';
  password.value = '';
});

ipcRenderer.on('alert', (e, message) => {
  showAlert(message);
});

function showAlert(message) {
  alert(message);
}
