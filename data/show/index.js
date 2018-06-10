/* globals parse */
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

var get = (id, obj) => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'notmuch.show',
  query: 'id:' + id,
  part: obj.id,
  format: 'raw',
  html: false
}, resolve));

var args = location.search.replace('?', '').split('&').reduce((p, c) => {
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
      console.log(e);
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
