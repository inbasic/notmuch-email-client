/* globals webext, native, EventEmitter */
'use strict';

const badge = new EventEmitter();
window.badge = badge;
badge.sync = true; // pass true to the external executable to ask for server sync

let oldstdout = '';

badge.setup = () => webext.storage.get({
  delay: 2, // seconds
  interval: 5, // minutes
  command: ''
}).then(prefs => {
  if (prefs.command) {
    let title = `In progress (synced: ${badge.sync})`;
    if (oldstdout) {
      title = oldstdout.trim() + '\n\n--\n\n' + title;
    }
    webext.browserAction.setTitle({
      title
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
    native.exec({
      action: command + ' ' + badge.sync
    }).then(r => {
      const count = r.stdout.trim().split('\n')[0].substr(0, 5);
      webext.browserAction.setBadgeText({
        text: count !== '0' ? count : ''
      });
      const stdout = isNaN(count) ? r.stdout : r.stdout.replace(count, '');
      const title = 'Last run (with synced: ' + old + ') ' + (new Date()).toLocaleString() + `

${(stdout || r.stderr)}`;
      webext.browserAction.setTitle({
        title: title.trim()
      });
      if (isNaN(count) === false) {
        oldstdout = stdout;
        badge.emit('count', {
          stdout,
          count
        });
      }
      else {
        oldstdout = '';
      }
    }).catch(e => {
      webext.browserAction.setBadgeText({
        text: 'E'
      });
      webext.browserAction.setTitle({
        title: e.message || e.stderr || e.stdout || 'no error description'
      });
      console.error(e);
    });
    badge.sync = true; // reset sync status
  }
})).if(({name}) => name === 'periodic-job');

webext.runtime.on('start-up', badge.setup);
webext.idle.on('changed', badge.setup).if(s => s === 'active');
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
