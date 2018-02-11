/* globals webext, tree, args */
'use strict';

if (args.plugins !== 'false') {
  // save last id;
  tree.on('select', id => webext.storage.set({
    'last-id': id
  }));
  // open last id
  tree.on('ready', () => {
    const root = [];

    const once = () => {
      const id = root.shift();
      if (id) {
        // prevent communication until last child is ready
        tree.allow.transmit = root.length === 0;

        tree.select(id, root.length);
      }
      else {
        tree.off('select', once);
      }
    };
    tree.on('select', once);

    webext.storage.get({
      'last-id': null
    }).then(prefs => {
      if (prefs['last-id']) {
        let i = 0;
        tree.separate(prefs['last-id']).forEach(s => {
          i += s.length;
          root.push(prefs['last-id'].substr(0, i));
          i += 1;
        });
        once();
      }
    });
  });
}
