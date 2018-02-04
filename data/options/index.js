/* globals config, webext */
'use strict';

webext.storage.get(null).then(prefs => {
  prefs = Object.assign(config, prefs);
  delete prefs['last-update'];
  delete prefs['last-id'];
  delete prefs.version;
  document.getElementById('json').value = JSON.stringify(prefs, null, '  ');
});

document.getElementById('save').addEventListener('click', () => {
  const info = document.getElementById('info');
  let delay = 750;
  try {
    const json = JSON.parse(document.getElementById('json').value);
    console.log(json);
    webext.storage.set(json);
    info.textContent = 'Options saved';
  }
  catch (e) {
    info.textContent = e.message;
    delay = 3000;
  }
  window.setTimeout(() => info.textContent = '', delay);
});
