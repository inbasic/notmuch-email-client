/* global webext, native */
'use strict';

native.notmuch.count = ({query}) => {
  native.log('native.notmuch.count', query);
  return webext.runtime.connectNative(native.id, {
    permissions: ['child_process', 'os'],
    args: [native.path, native.notmuch.clean(query, ['output'])],
    script: String.raw`
      const [command, query] = args;

      const exec = args => new Promise(resolve => {
        const notmuch = require('os').platform() === 'win32' ?
          require('child_process').spawn('${native.windows}', ['notmuch', ...args]) :
          require('child_process').spawn(command, args);

        let stderr = '';
        let stdout = '';
        notmuch.stdout.on('data', data => stdout += data);
        notmuch.stderr.on('data', data => stderr += data);
        notmuch.on('close', code => resolve({code, stdout, stderr}));
        notmuch.stdin.end();
      });

      Promise.all([
        exec(['count', '--output=threads', query]),
        exec(['count', '--output=threads', 'tag:unread', query]),
      ]).then(([a, b]) => {
        push({
          code: a.code || b.code,
          total: Number(a.stdout.trim()),
          unread: Number(b.stdout.trim()),
          stderr: a.stderr || b.stderr
        });
        close();
      }).catch(error => {
        push({
          code: 1,
          error: error.message || error
        });
        close();
      });
    `
  }).build();
};
