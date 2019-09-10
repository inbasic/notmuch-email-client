/* globals native, webext */
'use strict';

native.policy = (tabId, query) => {
  // native.log('native.policy', tabId, query);

  const post = (r, q = query) => {
    chrome.tabs.sendMessage(tabId, {
      method: 'notmuch.count.response',
      unread: r.unread,
      total: r.total,
      query: q
    });
    webext.runtime.emit('notmuch.count.response');
  };

  native.notmuch.count({query}).then(r => post(r));
  // if query has a "path:", do another count only on path
  if (query.indexOf('path:') !== -1 && query.trim().indexOf(' ') !== -1) {
    const q = /path:[^\s]*/.exec(query)[0];
    native.notmuch.count({
      query: q
    }).then(r => post(r, q));
  }
};
