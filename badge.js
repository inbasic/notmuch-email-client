/* globals webext, native */
'use strict';

var badge = {
  sync: true // pass true to the external executable to ask for server sync
};
badge.setup = () => webext.storage.get({
  delay: 2, // seconds
  interval: 5, // minutes
  command: ''
}).then(prefs => {
  if (prefs.command) {
    webext.browserAction.setTitle({
      title: `Timer in progress (synced: ${badge.sync})`
    });
    webext.alarms.create('periodic-job', {
      when: Date.now() + Math.max(0, prefs.delay) * 1000,
      periodInMinutes: Math.max(prefs.interval, 1)
    });
  }
  else {
    webext.browserAction.setTitle({
      title: 'No periodic job is defined'
    });
    webext.alarms.clear('periodic-job');
  }
});

webext.alarms.on('alarm', () => webext.storage.get({
  command: ''
}).then(({command}) => {
  if (command) {
    const old = badge.sync;
    badge.sync = true; // reset sync status
    native.exec({
      action: command + ' ' + badge.sync
    }).then(r => {
      webext.browserAction.setTitle({
        title: 'Last run (with synced: ' + old + ') ' + (new Date()).toLocaleString()
      });
      webext.browserAction.setBadgeText({
        text: r.stdout.trim().substr(0, 5)
      });
    }).catch(e => console.error(e));
  }
})).if(({name}) => name === 'periodic-job');

webext.runtime.on('start-up', badge.setup);
webext.runtime.on('notmuch.count.response', () => {
  badge.sync = false;
  badge.setup();
});
webext.contextMenus.on('clicked', ({menuItemId}) => {
  badge.sync = menuItemId === 'badge-sync';
  badge.setup();
}).if(({menuItemId}) => menuItemId === 'badge-no-sync' || menuItemId === 'badge-sync');
webext.storage.on('changed', () => {
  badge.sync = false;
  badge.setup();
}).if(prefs => prefs.delay || prefs.interval || prefs.command);
