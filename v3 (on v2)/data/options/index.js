/* global config, webext */
'use strict';

webext.storage.get(null).then(prefs => {
  prefs = Object.assign(config, prefs);
  delete prefs['last-update'];
  delete prefs['last-id'];
  delete prefs.version;
  document.getElementById('json').value = JSON.stringify(prefs, null, '  ');
});
document.getElementById('list-css').value = localStorage.getItem('list-css') || '';
document.getElementById('tree-css').value = localStorage.getItem('tree-css') || '';
document.getElementById('search-css').value = localStorage.getItem('search-css') || '';
document.getElementById('client-css').value = localStorage.getItem('client-css') || '';
document.getElementById('show-css').value = localStorage.getItem('show-css') || '';
document.getElementById('reply-css').value = localStorage.getItem('reply-css') || '';
document.getElementById('notmuch').value = localStorage.getItem('notmuch') || '/usr/local/bin/notmuch';
document.getElementById('wsl').value = localStorage.getItem('wsl') || 'C:\\\\Windows\\\\System32\\\\wsl.exe';
document.getElementById('log').checked = localStorage.getItem('log') === 'true';

document.getElementById('save').addEventListener('click', () => {
  const info = document.getElementById('info');
  let delay = 750;
  try {
    const json = JSON.parse(document.getElementById('json').value);
    webext.storage.set(json);
    info.textContent = 'Options saved';
  }
  catch (e) {
    info.textContent = e.message;
    delay = 3000;
  }

  localStorage.setItem('list-css', document.getElementById('list-css').value);
  localStorage.setItem('tree-css', document.getElementById('tree-css').value);
  localStorage.setItem('search-css', document.getElementById('search-css').value);
  localStorage.setItem('client-css', document.getElementById('client-css').value);
  localStorage.setItem('show-css', document.getElementById('show-css').value);
  localStorage.setItem('reply-css', document.getElementById('reply-css').value);

  localStorage.setItem('notmuch', document.getElementById('notmuch').value);
  localStorage.setItem('wsl', document.getElementById('wsl').value);
  localStorage.setItem('log', document.getElementById('log').checked);

  window.setTimeout(() => info.textContent = '', delay);
});

document.getElementById('import').addEventListener('click', () => {
  const fileInput = document.createElement('input');
  fileInput.style.display = 'none';
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.acceptCharset = 'utf-8';

  document.body.appendChild(fileInput);
  fileInput.initialValue = fileInput.value;
  fileInput.onchange = readFile;
  fileInput.click();

  function readFile() {
    if (fileInput.value !== fileInput.initialValue) {
      const file = fileInput.files[0];
      if (file.size > 100e6) {
        console.warn('100MB backup? I don\'t believe you.');
        return;
      }
      const fReader = new FileReader();
      fReader.onloadend = event => {
        fileInput.remove();
        const {synced, asynced} = JSON.parse(event.target.result);
        Object.entries(synced).forEach(([key, value]) => localStorage.setItem(key, value));
        chrome.storage.local.set(asynced, () => {
          chrome.runtime.reload();
          window.close();
        });
      };
      fReader.readAsText(file, 'utf-8');
    }
  }
});

document.getElementById('export').addEventListener('click', async() => {
  const asynced = await webext.storage.get(null);

  const text = JSON.stringify({
    asynced,
    synced: localStorage
  }, null, '  ');
  const blob = new Blob([text], {type: 'application/json'});
  const objectURL = URL.createObjectURL(blob);
  chrome.downloads.download({
    url: objectURL,
    filename: 'notmuch-client-preferences.json'
  }, () => {
    window.setTimeout(() => URL.revokeObjectURL(objectURL), 10000);
  });
});
