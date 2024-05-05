/* global parse */
'use strict';

// apply user-styles
{
  const textContent = localStorage.getItem('show-css');
  if (textContent) {
    document.documentElement.appendChild(Object.assign(document.createElement('style'), {
      textContent
    }));
  }
}

/* we cannot send ArrayBuffer from worker to page */
const get = (id, obj) => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'notmuch.show',
  query: 'id:' + id,
  part: obj.id,
  format: 'raw',
  html: false,
  mime: obj['content-type']
}, o => {
  const port = chrome.runtime.connectNative(o.id);
  const parts = [];
  port.onMessage.addListener(e => {
    if (e.stdout) {
      parts.push(e.stdout.data);
    }
    else if ('code' in e) {
      port.disconnect();

      const bytes = new Uint8Array(parts.flat());
      const blob = new Blob([bytes], {
        type: obj['content-type']
      });
      const url = URL.createObjectURL(blob);
      resolve(url);
    }
  });
  port.postMessage(o.options);
}));

const args = location.search.replace('?', '').split('&').reduce((p, c) => {
  const [key, value] = c.split('=');
  p[key] = decodeURIComponent(value);
  return p;
}, {});

if (args.query) {
  chrome.runtime.sendMessage({
    method: 'notmuch.show',
    query: args.query,
    entire: false
  }, r => {
    try {
      const parts = parse(r.content);
      parse.insert(parts);
      document.body.dataset.loading = false;

      // mark as read
      chrome.runtime.sendMessage({
        method: 'notmuch.tag',
        threads: [], // query already has the threads
        tags: ['-unread'],
        query: args.query
      }, () => {
        if (window.top !== window) {
          window.top.api.list.emit('refresh');
        }
      });
    }
    catch (e) {
      console.error(e);
      document.body.textContent = e.message;
    }
  });
}
else {
  document.body.textContent = 'No query!';
}

document.addEventListener('click', ({target}) => {
  const cmd = target.dataset.cmd;

  if (cmd === 'attachment') {
    get(target.dataset.id, target.attachment).then(url => chrome.downloads.download({
      url,
      filename: target.attachment.filename
    }, d => {
      URL.revokeObjectURL(url);
    }));
  }
  else if (cmd === 'close-me') {
    if (window.top !== window) {
      window.top.api.popup.hide();
    }
  }
  else if (cmd === 'load-remote') {
    const iframe = target.closest('table').nextElementSibling;
    parse.reload(iframe);
  }
});
