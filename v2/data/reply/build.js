/* globals parse, utils, config */
'use strict';

parse.images = () => {};
parse.headers = (obj, parent) => {
  const div = document.createElement('div');
  const body = document.createElement('div');
  body.classList.add('body');

  div.appendChild(body);
  parent.appendChild(div);

  return Promise.resolve({
    body,
    attachments: window
  });
};

// apply user-styles
{
  const textContent = localStorage.getItem('reply-css');
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
    query: args.query
  }, r => {
    try {
      const parts = parse(r.content);
      const body = document.getElementById('content');
      parts.forEach(part => part.bodies.forEach(o => {
        if (o.text) {
          body.appendChild(Object.assign(document.createElement('pre'), {
            textContent: o.text.trim()
          }));
        }
        else if (o.html) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(o.html, 'text/html');
          [...doc.childNodes].filter(node => node.nodeType !== 10)
            .forEach(node => body.appendChild(node));
        }
      }));

      chrome.runtime.sendMessage({
        method: 'notmuch.reply',
        query: args.query,
        replyTo: args.replyTo || 'all'
      }, r => {
        const info = document.querySelector('#body span');
        document.body.dataset.loading = false;
        if (r.error) {
          document.getElementById('reply').disabled = true;
          return info.textContent = r.error.stderr;
        }
        const content = r.content;
        document.getElementById('From').value = content['reply-headers']['From'];
        document.getElementById('In-reply-to').value = content['reply-headers']['In-reply-to'];
        document.getElementById('References').value = content['reply-headers']['References'];
        document.getElementById('Subject').value = content['reply-headers']['Subject'];
        document.getElementById('To').value = content['reply-headers']['To']
          .replace(/[^,]* </g, ' ').replace(/>/g, '').trim();

        const original = content.original;
        info.textContent = `
On ${(new Date(original.timestamp * 1000)).toLocaleString()}, ${original.headers.From} wrote:
`;
        document.getElementById('From').focus();
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

// fill accounts
(async() => {
  const prefs = await utils.storage.get(config);
  if (prefs.reply && prefs.reply.accounts) {
    const accounts = document.getElementById('accounts');
    prefs.reply.accounts.forEach(value => accounts.appendChild(Object.assign(document.createElement('option'), {
      value
    })));
  }
})();
