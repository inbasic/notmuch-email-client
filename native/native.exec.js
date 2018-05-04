/* globals webext, native */
'use strict';

native.exec = ({action}) => webext.runtime.connectNative(native.id, {
  permissions: ['child_process', 'os'],
  args: [action],
  script: String.raw`
    const callback = (error, stdout, stderr) => {
      push({
        stdout,
        stderr: stderr || (error ? error.message : ''),
        code: (error || stderr) ? 1 : 0
      });
      close();
    }

    const cmd = require('os').platform() === 'win32' ?
      require('child_process').exec('${native.windows} ' + args[0], callback) :
      require('child_process').exec(args[0], callback);

    cmd.stdin.end();
  `
}).build();
