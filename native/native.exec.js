/* globals webext, native */
'use strict';

native.exec = ({action}) => webext.runtime.connectNative(native.id, {
  permissions: ['child_process'],
  args: [action],
  script: String.raw`
    require('child_process').exec(args[0], (error, stdout, stderr) => {
      push({
        stdout,
        stderr: stderr || (error ? error.message : ''),
        code: (error || stderr) ? 1 : 0
      });
      close();
    });
  `
}).build();
