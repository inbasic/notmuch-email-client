/* globals webext, native */
'use strict';

native.notmuch.show = ({
  query,
  body = true,
  exclude = true,
  entire = true,
  html = true,
  part = null,
  format = 'json'
}) => webext.runtime.connectNative(native.id, {
  permissions: ['child_process'],
  args: [
    native.path,
    native.notmuch.clean(query, [
      'format', 'entire-thread', 'include-html', 'body', 'exclude', 'part'
    ]),
    body,
    exclude,
    entire,
    html,
    part,
    format
  ],
  script: String.raw`
    const [command, query, body, exclude, entire, html, part, format] = args;

    const params = ['show', '--format=' + format, '--entire-thread=' + entire];
    if (html) {
      params.push('--include-html');
    }
    if (part) {
      params.push('--part=' + part);
    }
    params.push('--body=' + body, '--exclude=' + exclude);
    params.push(query);

    const notmuch = require('child_process').spawn(command, params);
    notmuch.stdout.on('data', stdout => push({
      stdout: format === 'json' ? String(stdout) : stdout
    }));
    notmuch.stderr.on('data', stderr => push({
      stderr: format === 'json' ? String(stderr) : stderr
    }));
    notmuch.on('close', code => {
      push({
        code
      });
      close();
    });
  `
}).build().then(r => {
  if (format === 'json') {
    const content = r.responses.map(o => o.stdout).join('');

    return {
      content: JSON.parse(content)
    };
  }
  const bytes = new Uint8Array([].concat.apply([], r.responses.map(({stdout}) => stdout.data)));
  const blob = new Blob([bytes]);
  return URL.createObjectURL(blob);
});
