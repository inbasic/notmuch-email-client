/* globals webext, native */
'use strict';

native.notmuch.search = ({query, limit = 50, offset = 0, output = 'summary'}) => {
  native.log('native.notmuch.search', query, limit, offset, output);
  query = native.notmuch.clean(query, ['limit', 'offset', 'format', 'output']);

  return webext.runtime.connectNative(native.id, {
    permissions: ['child_process', 'os'],
    args: [native.path, query, limit, offset, output],
    script: String.raw`
      /* globals args, push, close, require */
      'use strict';

      const [command, query, limit, offset, output] = args;
      let notmuch;
      if (require('os').platform() === 'win32') {
        notmuch = require('child_process').spawn(
          '${native.windows}',
          ['notmuch', 'search', '--limit=' + limit, '--offset=' + offset, '--format=json', '--output=' + output, query]
        );
      }
      else {
        notmuch = require('child_process').spawn(
          command,
          ['search', '--limit=' + limit, '--offset=' + offset, '--format=json', '--output=' + output, query]
        );
      }

      let stderr = '';
      let stdout = '';
      notmuch.stdout.on('data', data => stdout += data);
      notmuch.stderr.on('data', data => stderr += data);
      notmuch.on('close', code => {
        if (code === 0) {
          JSON.parse(stdout).forEach(push);
          push({code: 0});
          close();
        }
        else {
          push({code, stdout, stderr});
          close();
        }
      });
      notmuch.stdin.end();
    `
  }).build();
};
