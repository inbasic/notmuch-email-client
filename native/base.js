'use strict';

const native = {
  id: 'com.add0n.node',
  get path() {
    return localStorage.getItem('notmuch') || '/usr/local/bin/notmuch';
  },
  get windows() {
    return localStorage.getItem('wsl') || 'C:\\\\Windows\\\\System32\\\\wsl.exe';
  },
  log(...args) {
    if (localStorage.getItem('log') === 'true') {
      const d = new Date();
      console.log(d.toLocaleString(), ...args);
    }
  }
};
window.native = native;

native.notmuch = {};
native.notmuch.clean = (query, keys) => {
  // native.log('native.notmuch.clean', query, keys);
  keys.forEach(key => query = query.replace(new RegExp('--' + key + '=[^\\s]*'), ''));
  return query;
};
