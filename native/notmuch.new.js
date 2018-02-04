/* globals webext, native */
'use strict';

/* "query" and "tabId" are used for the count run */
native.notmuch.new = ({query = '', tabId}) => webext.runtime.connectNative(native.id, {
  permissions: ['child_process'],
  args: [native.path],
  script: String.raw`
    const notmuch = require('child_process').spawn(args[0], ['new']);
    let stderr = '', stdout = '';
    notmuch.stdout.on('data', data => stdout += data);
    notmuch.stderr.on('data', data => stderr += data);
    notmuch.on('close', code => {
      push({code, stdout, stderr});
      close();
    });
  `
}).build().then(r => {
  if (r.code === 0) {
    native.notmuch.count({
      query
    }).then(r => chrome.tabs.sendMessage(tabId, {
      method: 'notmuch.count.response',
      unread: r.unread,
      total: r.total,
      query
    }));
  }
  return r;
});
