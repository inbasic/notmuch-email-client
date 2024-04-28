/* global native, webext */

// self.importScripts('config.js');
// self.importScripts('webext.js');
// self.importScripts(
//   'native/base.js', 'native/native.exec.js', 'native/native.files.js', 'native/native.policy.js',
//   'native/notmuch.tag.js', 'native/notmuch.new.js', 'native/notmuch.reply.js', 'native/notmuch.search.js',
//   'native/notmuch.count.js', 'native/notmuch.config.js', 'native/notmuch.show.js'
// );
// self.importScripts('badge.js');
// self.importScripts('notification.js');
// self.importScripts('context.js');

const localStorage = {
  getItem(name) {
    return localStorage.prefs[name];
  },
  setItem(name, value) {
    chrome.storage.local.set({
      name: value
    });
  }
};
localStorage.prefs = {
  notmuch: '/usr/local/bin/notmuch',
  wsl: 'C:\\\\Windows\\\\System32\\\\wsl.exe',
  log: 'false'
};

// messaging
chrome.runtime.onMessage.addListener((request, sender, response) => {
  const command = ({
    'notmuch.tag': native.notmuch.tag,
    'notmuch.new': native.notmuch.new,
    'notmuch.search': native.notmuch.search,
    'notmuch.show': native.notmuch.show,
    'notmuch.reply': native.notmuch.reply,
    'notmuch.config.get': native.notmuch.config.get,
    'native.exec': native.exec,
    'native.files.list': native.files.list,
    'native.files.move': native.files.move,
    'native.files.file': native.files.file,
    'native.files.read': native.files.read,
    'native.files.remove.file': native.files.remove.file,
    'native.files.remove.directory': native.files.remove.directory
  })[request.method];
  if (command) {
    chrome.storage.local.get({
      notmuch: '/usr/local/bin/notmuch',
      wsl: 'C:\\\\Windows\\\\System32\\\\wsl.exe',
      log: 'false'
    }, prefs => {
      Object.assign(localStorage.prefs, prefs);
      if (request.method === 'notmuch.tag' || request.method === 'notmuch.new') {
        request.tabId = sender.tab.id;
      }
      command(request).then(r => {
        try {
          response(r);
        }
        catch (e) {}
        chrome.runtime.lastError;
      }).catch(error => {
        response({error});
      });
    });

    return true;
  }
});

// allow all modules to get the count's result
webext.runtime.on('message', (request, sender) => {
  native.policy(sender.tab.id, request.query);
}).if(({method}) => method === 'notmuch.count');

// browser-action
{
  const onClicked = tab => chrome.runtime.sendMessage({
    method: 'exists'
  }, resp => {
    if (resp !== true) {
      chrome.tabs.create({
        url: '/data/client/index.html',
        index: tab?.index ? tab.index + 1 : undefined
      });
    }
  });
  webext.runtime.on('message', (request, sender) => {
    const {id, windowId} = sender.tab;
    chrome.tabs.update(id, {
      active: true
    }, () => chrome.tabs.sendMessage(id, {
      method: 'list.refresh'
    }));
    chrome.windows.update(windowId, {
      focused: true
    });
  }).if(({method}) => method === 'focus');

  webext.action.on('clicked', onClicked);
  webext.notifications.on('clicked', notificationId => {
    webext.notifications.clear(notificationId);
    onClicked();
  });
}

// notifications
webext.runtime.on('message', request => {
  webext.notifications.create({
    message: request.message
  });
}).if(({method}) => method === 'notify');

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
