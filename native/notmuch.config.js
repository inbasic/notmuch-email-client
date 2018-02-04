/* globals webext, native */
'use strict';

native.notmuch.config = {};
native.notmuch.config.get = ({name}) => webext.runtime.connectNative(native.id, {
  permissions: ['child_process', 'path'],
  args: [native.path],
  script: String.raw`
    require('child_process').exec(args[0] + ' config get ${name}', (error, stdout, stderr) => {
      push({
        stdout,
        stderr: stderr || (error ? error.message : ''),
        code: (error || stderr) ? 1 : 0,
        sep: require('path').sep
      });
      close();
    });
  `
}).build().then(r => {
  if (name === 'database.path') {
    native.root = r.stdout.trim() + r.sep;
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
