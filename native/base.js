'use strict';

var native = {
  id: 'com.add0n.node',
  path: '/usr/local/bin/notmuch'
};

native.notmuch = {};
native.notmuch.clean = (query, keys) => {
  keys.forEach(key => query = query.replace(new RegExp('--' + key + '=[^\\s]*'), ''));
  return query;
};
