/* global webext, native */
'use strict';

/* "query" and "tabId" are used for the count run */
native.notmuch.new = ({query = '', tabId}) => {
  native.log('native.notmuch.new', query, tabId);
  return webext.runtime.connectNative(native.id, {
    permissions: ['child_process', 'os'],
    args: [native.path],
    script: String.raw`
      const notmuch = require('os').platform() === 'win32' ?
        require('child_process').spawn('${native.windows}', ['notmuch', 'new']) :
        require('child_process').spawn(args[0], ['new']);

      let stderr = '', stdout = '';
      notmuch.stdout.on('data', data => stdout += data);
      notmuch.stderr.on('data', data => stderr += data);
      notmuch.on('close', code => {
        push({code, stdout, stderr});
        close();
      });
      notmuch.stdin.end();
    `
  }).build().then(r => {
    if (r.code === 0) {
      native.policy(tabId, query);
    }
    return r;
  });
};
