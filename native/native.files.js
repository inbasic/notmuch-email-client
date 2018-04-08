/* globals webext, native*/
'use strict';

native.files = {};

native.files.list = ({root, path = ''}) => webext.runtime.connectNative(native.id, {
  permissions: ['child_process', 'os', 'path'],
  args: [root, path],
  script: String.raw`
    const path = require('path');
    const dir = path.join(...args).replace(/\\/g, '/');
    const ls = require('os').platform() === 'win32' ?
      require('child_process').spawn('${native.windows}', ['ls' ,'-p', dir]) :
      require('child_process').spawn('ls', ['-p', dir]);

    let stderr = '', stdout = '';
    ls.stdout.on('data', data => stdout += data);
    ls.stderr.on('data', data => stderr += data);
    ls.on('close', code => {
      if (code === 0) {
        const files = stdout.trim().split('\n').map(name => ({
          name: name.replace(/\/$/, ''),
          path: path.join(...args, name).replace(/\\/g, '/').replace(/\/$/, ''),
          dir: /\/$/.test(name)
        }));
        push({
          files,
          code: 0
        });
      }
      else {
        push({code, stdout, stderr});
      }
      close();
    });
    ls.stdin.end();
  `
}).build();

native.files.move = ({files, dir}) => webext.runtime.connectNative(native.id, {
  permissions: ['child_process', 'os'],
  args: [...files, dir],
  script: String.raw`
    /* globals require, push, close, args */

    const mv = require('os').platform() === 'win32' ?
      require('child_process').spawn('${native.windows}', ['mv', ...args]) :
      require('child_process').spawn('mv', [...args]);

    let stderr = '', stdout = '';
    mv.stdout.on('data', data => stdout += data);
    mv.stderr.on('data', data => stderr += data);
    mv.on('close', code => {
      push({
        code,
        stderr,
        stdout
      });
      close();
    });
    mv.stdin.end();
  `
}).build();

native.files.file = ({filename, content}) => webext.runtime.connectNative(native.id, {
  permissions: ['fs', 'path', 'os'],
  args: [filename, content],
  script: String.raw`
    /* globals require, push, close, args */
    const os = require('os');
    const fs = require('fs');
    const path = require('path');
    const [filename, content] = args;
    fs.mkdtemp(path.join(os.tmpdir(), 'native-'), (error, directory) => {
      if (error) {
        push({
          code: 1,
          error
        });
        return close();
      }
      const file = path.join(directory, filename);
      fs.writeFile(file, content, error => {
        if(error) {
          push({
            code: 1,
            error
          });
        }
        push({
          file,
          directory,
          filename,
          code: 0
        });
        close();
      });
    });
  `
}).build();

native.files.remove = {

};

native.files.remove.file = ({path}) => webext.runtime.connectNative(native.id, {
  permissions: ['fs'],
  args: [path],
  script: String.raw`
    /* globals require, push, close, args */
    const fs = require('fs');

    fs.unlink(args[0], error => {
      if (error) {
        push({
          error,
          code: 1
        });
      }
      else {
        push({code: 0});
      }
      close();
    });
  `
}).build();

native.files.remove.directory = ({path}) => webext.runtime.connectNative(native.id, {
  permissions: ['fs'],
  args: [path],
  script: String.raw`
    /* globals require, push, close, args */
    const fs = require('fs');

    fs.rmdir(args[0], error => {
      if (error) {
        push({
          error,
          code: 1
        });
      }
      else {
        push({code: 0});
      }
      close();
    });
  `
}).build();
