/* global webext, native */
'use strict';

native.notmuch.show = ({
  query,
  body = true,
  exclude = true,
  entire = true,
  html = true,
  part = null,
  format = 'json',
  mime
}) => {
  // console.log(query);
  // console.log(new Error().stack);

  native.log('native.notmuch.show', query, body, exclude, entire, html, part, format);

  const options = {
    permissions: ['child_process', 'os'],
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

      const notmuch = require('os').platform() === 'win32' ?
        require('child_process').spawn('${native.windows}', ['notmuch', ...params]) :
        require('child_process').spawn(command, params);

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
      notmuch.stdin.end();
    `
  };

  if (format === 'raw') {
    return Promise.resolve({
      id: native.id,
      options
    });
  }

  return webext.runtime.connectNative(native.id, options).build().then(r => {
    if (format === 'json') {
      const content = r.responses.map(o => o.stdout).join('');

      return {
        content: JSON.parse(content)
      };
    }
    throw Error('NOT_SUPPORTED_' + format);
  });
};
