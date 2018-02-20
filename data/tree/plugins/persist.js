/* globals webext, tree, args */
'use strict';

if (args.plugins !== 'false' && !args.path) {
  // save last id;
  tree.on('select', id => webext.storage.set({
    'last-id': id
  }));
  // open last id
  tree.on('ready', () => {
    webext.storage.get({
      'last-id': null
    }).then(prefs => {
      if (prefs['last-id']) {
        tree.browse(prefs['last-id']);
      }
    });
  });
}
