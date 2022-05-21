/* globals webext, native */
'use strict';

native.notmuch.reply = ({query, replyTo = 'all'}) => {
  native.log('native.notmuch.reply', query, replyTo);
  query = native.notmuch.clean(query, ['offset', 'reply-to']);

  return webext.runtime.connectNative(native.id, {
    permissions: ['child_process', 'os'],
    args: [native.path, query, replyTo],
    script: String.raw`
      /* globals args, push, close, require */
      'use strict';

      const [command, query, replyTo] = args;
      const notmuch = require('os').platform() === 'win32' ?
        require('child_process').spawn(
          '${native.windows}',
          ['notmuch', 'reply', '--format=json', '--reply-to=' + replyTo, query]
        ) : require('child_process').spawn(
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
      notmuch.stdin.end();
    `
  }).build();
};
