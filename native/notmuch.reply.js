/* globals webext, native */
'use strict';

native.notmuch.reply = ({query, replyTo = 'all'}) => {
  query = native.notmuch.clean(query, ['offset', 'reply-to']);

  return webext.runtime.connectNative(native.id, {
    permissions: ['child_process'],
    args: [native.path, query, replyTo],
    script: String.raw`
      /* globals args, push, close, require */
      'use strict';

      const [command, query, replyTo] = args;
      const notmuch = require('child_process').spawn(
        command,
        ['reply', '--format=json', '--reply-to=' + replyTo, query]
      );
      let stderr = '';
      let stdout = '';
      notmuch.stdout.on('data', data => stdout += data);
      notmuch.stderr.on('data', data => stderr += data);
      notmuch.on('close', code => {
        if (code === 0) {
          push({
            content: JSON.parse(stdout),
            code: 0
          });
          close();
        }
        else {
          push({code, stderr});
          close();
        }
      });
    `
  }).build();
};
