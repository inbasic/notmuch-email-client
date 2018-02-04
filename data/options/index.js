/* globals config, webext */
'use strict';

webext.storage.get(config).then(prefs => {
  document.getElementById('json').value = JSON.stringify(Object.assign(config, prefs), null, '  ');
});

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
  window.setTimeout(() => info.textContent = '', delay);
});
