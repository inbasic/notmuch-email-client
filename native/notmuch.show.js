/* globals webext, native */
'use strict';

native.notmuch.show = ({query, body = true, exclude = true, entire = true, html = true}) => webext.runtime.connectNative(native.id, {
  permissions: ['child_process'],
  args: [
    native.path,
    native.notmuch.clean(query, [
      'format', 'entire-thread', 'include-html', 'body', 'exclude'
    ]),
    body,
    exclude,
    entire,
    html
  ],
  script: String.raw`
    const [command, query, body, exclude, entire, html] = args;

    const params = ['show', '--format=json', '--entire-thread=' + entire];
    if (html) {
      params.push('--include-html');
    }
    params.push('--body=' + body, '--exclude=' + exclude);
    params.push(query);

    const notmuch = require('child_process').spawn(command, params);
    let stderr = '';
    let stdout = '';
    notmuch.stdout.on('data', data => stdout += data);
    notmuch.stderr.on('data', data => stderr += data);
    notmuch.on('close', code => {
      push({
        code,
        stdout,
        stderr
      });
      close();
    });
  `
}).build().then(r => ({
  content: JSON.parse(r.stdout)
}));
