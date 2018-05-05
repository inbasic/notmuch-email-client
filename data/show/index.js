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
      parse(r.content);
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
