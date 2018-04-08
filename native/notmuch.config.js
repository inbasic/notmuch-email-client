/* globals webext, native */
'use strict';

native.notmuch.config = {};
native.notmuch.config.get = ({name}) => webext.runtime.connectNative(native.id, {
  permissions: ['child_process', 'path', 'os'],
  args: [native.path],
  script: String.raw`

    const notmuch = require('os').platform() === 'win32' ?
      require('child_process').spawn('${native.windows}', ['notmuch', 'config', 'get', '${name}']) :
      require('child_process').spawn(args[0], ['config', 'get', '${name}']);

    let stderr = '', stdout = '';
    notmuch.stdout.on('data', data => stdout += (data || ''));
    notmuch.stderr.on('data', data => stderr += (data || ''));
    notmuch.on('close', code => {
      push({
        code,
        stdout,
        stderr,
        sep: require('path').sep
      });
      close();
    });
    notmuch.stdin.end();
  `
}).build().then(r => {
  if (name === 'database.path') {
    native.root = r.stdout.trim() + '/';
    return {
      stdout: native.root
    };
  }
  else {
    return {
      stdout: r.stdout.trim()
    };
  }
});
