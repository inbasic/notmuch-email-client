/* global webext, tree, args */
'use strict';

if (args.plugins !== 'false' && !args.path) {
  const {api} = window.top;
  const query = api.args.has('query');

  // open last id
  tree.on('ready', () => {
    webext.storage.get({
      'last-id': null
    }).then(prefs => {
      if (prefs['last-id']) {
        tree.browse(prefs['last-id'], query);
      }
      // save last id;
      tree.on('maildir', id => webext.storage.set({
        'last-id': id
      }));
    });
  });
}
