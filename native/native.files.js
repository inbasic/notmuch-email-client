/* globals webext, native*/
'use strict';

native.files = {};

native.files.list = ({root, path = ''}) => webext.runtime.connectNative(native.id, {
  permissions: ['fs', 'path'],
  args: [root, path],
  script: String.raw`
    const {lstatSync, readdir} = require('fs');
    const path = require('path');

    const isDirectory = source => lstatSync(source).isDirectory();

    readdir(path.join(args[0], args[1]), (error, files) => {
      files = (files || []).map(name => {
        const p = path.join(args[0], args[1], name);
        return {
          name,
          path: p,
          dir: isDirectory(p)
        };
      });
      push({
        error,
        files,
        code: error ? 1 : 0
      });
      close();
    })
  `
}).build();

native.files.move = ({files, dir}) => webext.runtime.connectNative(native.id, {
  permissions: ['fs', 'path'],
  args: [files, dir],
  script: String.raw`
    /* globals require, push, close, args */
    const fs = require('fs');
    const path = require('path');
    const [files, dir] = args;
    const move = (s, d) => {
      dest = path.join(d, path.basename(s));
      return new Promise((resolve, reject) => fs.rename(s, dest, error => {
        if (error) {
          return reject(error);
        }
        resolve();
      }));
    };

    Promise.all(files.map(s => move(s, dir))).then(() => {
      push({code: 0});
      close();
    }).catch(error => {
      push({
        code: 1,
        error
      });
      close();
    });
  `
}).build();
