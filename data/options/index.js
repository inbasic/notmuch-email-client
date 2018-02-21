/* globals config, webext */
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

  window.setTimeout(() => info.textContent = '', delay);
});
