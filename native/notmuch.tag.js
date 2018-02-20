/* globals webext, native */
'use strict';

/* use ids for individual mails or threads for entire thread*/
/* "tabId" is used for the count run */
native.notmuch.tag = ({threads = [], ids = [], tags, query = '', tabId}) => {
  const args = ['tag', ...tags];
  args.push(...threads.map(t => 'thread:' + t));
  args.push(...ids.map(t => 'id:' + t));
  args.push(query);

  return webext.runtime.connectNative(native.id, {
    permissions: ['child_process'],
    args: [native.path, args],
    script: String.raw`
      const notmuch = require('child_process').spawn(args[0], args[1]);
      let stderr = '', stdout = '';
      notmuch.stdout.on('data', data => stdout += data);
      notmuch.stderr.on('data', data => stderr += data);
      notmuch.on('close', code => {
        push({code, stdout, stderr});
        close();
      });
    `
  }).build().then(r => {
    // if message is tagged as "spam" or "deleted", count is necessary
    if (
      tabId &&
      tags.indexOf('+spam') !== -1 ||
      tags.indexOf('-spam') !== -1 ||
      tags.indexOf('+deleted') !== -1 ||
      tags.indexOf('-deleted') !== -1 ||
      tags.indexOf('+unread') !== -1 ||
      tags.indexOf('-unread') !== -1
    ) {
      native.policy(tabId, query);
    }
    return r;
  });
};
