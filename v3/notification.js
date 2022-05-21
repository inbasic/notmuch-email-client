/* global badge, EventEmitter, native, webext */
'use strict';

const notification = new EventEmitter();

badge.on('count', ({stdout}) => {
  const threads = (stdout.match(/thread:[^\s]*/g) || []).map(t => t.replace('thread:', ''));
  const key = threads.join(',');
  chrome.storage.local.get({
    'new-mail-id': ''
  }, prefs => {
    if (key !== prefs.key) {
      const ots = (prefs['new-mail-id'] || '').split(',');
      const nts = threads.filter(t => ots.indexOf(t) === -1);
      chrome.storage.local.set({
        'new-mail-id': key
      });
      if (nts.length) {
        notification.emit('new-threads', nts);
      }
    }
  });
});

notification.on('new-threads', threads => {
  native.notmuch.show({
    query: threads.map(t => 'thread:' + t).join(' '),
    body: false,
    entire: false,
    html: false
  }).then(r => {
    let objs = [];

    function extract(arr) {
      arr.forEach(a => Array.isArray(a) ? extract(a) : objs.push(a));
    }
    extract(r.content);
    const now = Date.now();
    webext.storage.get({
      'notification-condition': 90, // only notify for emails arrived in the past 30 minutes
      'notification-format': 'From: [From][break]Subject: [Subject]',
      'notification-sound': 0,
      'notification-sound-volume': 80,
      'notification-sound-policies': [] // [{From:'.*', sound: 1}]
    }).then(prefs => {
      objs = objs.filter(a => a && a.headers)
        .filter(a => now - a.timestamp * 1000 < prefs['notification-condition'] * 60 * 1000);
      if (objs.length) {
        notification.emit('notify', {
          objs,
          format: prefs['notification-format'],
          sound: prefs['notification-sound'],
          volume: prefs['notification-sound-volume'],
          policies: prefs['notification-sound-policies']
        });
      }
    });
  });
});

// desktop notification
notification.on('notify', ({objs, format}) => {
  const message = objs.map(o => o.headers).map(o => format
    .replace('[From]', o.From)
    .replace('[To]', o.To)
    .replace('[Subject]', o.Subject)
    .replace('[Date]', o.Date)
    .replace(/\[break\]/g, '\n')).filter(a => a).join('\n\n');
  if (message) {
    webext.notifications.create({message});
  }
});

notification.sound = {
  play: (src, volume = 80) => chrome.windows.create({
    type: 'popup',
    focused: false,
    url: '/data/sounds/index.html?volume=' + volume + '&src=' + src,
    ...navigator.platform.startsWith('Win') ? {
      top: 10000,
      left: 10000,
      height: 20,
      width: 200
    } : {
      top: 1,
      left: 1,
      height: 1,
      width: 1
    }
  }),
  stop: () => chrome.runtime.sendMessage({
    method: 'close-audio'
  }, () => chrome.runtime.lastError)
};

// alert notification
notification.on('notify', ({objs, sound, policies, volume}) => {
  policies.forEach(policy => {
    objs.forEach(obj => {
      const bol = Object.keys(policy).filter(key => key !== 'sound').reduce((p, key) => {
        if (obj.headers[key] && (new RegExp(policy[key])).test(obj.headers[key])) {
          return true;
        }
        return false;
      }, false);
      if (bol) {
        sound = policy.sound;
      }
    });
  });

  if (isNaN(sound)) {
    notification.sound.play(sound, volume);
  }
  else {
    notification.sound.play('/data/sounds/' + sound + '.wav', volume);
  }
});
