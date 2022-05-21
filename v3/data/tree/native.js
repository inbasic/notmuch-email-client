/* global tree, webext, args */
'use strict';

tree.allow = {};
// transmit = false prevents communication with other frames
tree.allow.transmit = true;

// perform a new count
tree.count = id => webext.runtime.sendMessage({
  method: 'notmuch.count',
  query: 'path:' + id + '/**'
});

// do count once a maildir is selected
tree.on('maildir', id => {
  const target = tree.leaf(id);
  if (target && !target.count) {
    tree.count(id);
    target.count = true;
  }
});

// update counter
webext.runtime.on('message', ({query, unread, total}) => {
  const id = query.replace('path:', '').replace('/**', '');
  const target = tree.leaf(id);
  if (target) {
    target.total = total;
    target.unread = unread;

    const a = target.querySelector('a');
    const span = a.querySelector('span');
    if (span) {
      span.remove();
    }
    a.appendChild(Object.assign(document.createElement('span'), {
      textContent: `(${unread}/${total})`
    }));
  }
}).if(request => request.method === 'notmuch.count.response' && request.error === undefined && request.query.startsWith('path:'));

// update the list view and client's title if available
tree.on('maildir', id => {
  const {api} = window.top;

  api.list.show({
    query: 'path:' + id + '/**',
    total: tree.leaf(id).total
  }, 'maildir');
  api.client.title(id);
}).if(() => window.top !== window && tree.allow.transmit && args.sandbox !== 'true');
// smart label
tree.on('select', id => {
  const smart = tree.leaf(id).dataset.smart;
  if (smart) {
    chrome.runtime.sendMessage({
      method: 'native.files.read',
      path: smart
    }, r => {
      const {api} = window.top;
      api.list.show({
        query: r.content.split('\n').map(r => r.trim()).filter(r => r)
      }, 'smart');
      api.client.title('smart label');
    });
  }
});
