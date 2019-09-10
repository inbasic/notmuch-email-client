/* globals native, webext */
'use strict';

const ports = [];
chrome.runtime.onConnect.addListener(port => {
  ports.push(port);
  port.onDisconnect.addListener(() => {
    const index = ports.indexOf(port);
    ports.splice(index, 1);
  });
});

//
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

    return true;
  }
});

// allow all modules to get the count's result
webext.runtime.on('message', (request, sender) => {
  native.policy(sender.tab.id, request.query);
}).if(({method}) => method === 'notmuch.count');

// browser-action
{
  const onClicked = () => {
    if (ports.length) {
      const {id, windowId} = ports[0].sender.tab;
      chrome.tabs.update(id, {
        active: true
      }, () => chrome.tabs.sendMessage(id, {
        method: 'list.refresh'
      }));
      chrome.windows.update(windowId, {
        focused: true
      });
    }
    else {
      chrome.tabs.create({
        url: '/data/client/index.html'
      });
    }
  };

  webext.browserAction.on('clicked', onClicked);
  webext.notifications.on('clicked', notificationId => {
    webext.notifications.clear(notificationId);
    onClicked();
  });
}

// FAQs and Feedback
{
  const {onInstalled, setUninstallURL, getManifest} = chrome.runtime;
  const {name, version} = getManifest();
  const page = getManifest().homepage_url;
  onInstalled.addListener(({reason, previousVersion}) => {
    chrome.storage.local.get({
      'faqs': true,
      'last-update': 0
    }, prefs => {
      if (reason === 'install' || (prefs.faqs && reason === 'update')) {
        const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
        if (doUpdate && previousVersion !== version) {
          chrome.tabs.create({
            url: page + '?version=' + version +
              (previousVersion ? '&p=' + previousVersion : '') +
              '&type=' + reason,
            active: reason === 'install'
          });
          chrome.storage.local.set({'last-update': Date.now()});
        }
      }
    });
  });
  setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
}
