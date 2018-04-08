'use strict';

var native = {
  id: 'com.add0n.node',
  path: localStorage.getItem('notmuch') || '/usr/local/bin/notmuch',
  windows: localStorage.getItem('wsl') || 'C:\\\\Windows\\\\System32\\\\wsl.exe'
};

native.notmuch = {};
native.notmuch.clean = (query, keys) => {
  keys.forEach(key => query = query.replace(new RegExp('--' + key + '=[^\\s]*'), ''));
  return query;
};
