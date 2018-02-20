/* globals native, webext */
'use strict';

//
chrome.runtime.onMessage.addListener((request, sender, response) => {
  const command = ({
    'notmuch.tag': native.notmuch.tag,
    'notmuch.new': native.notmuch.new,
    'notmuch.search': native.notmuch.search,
    'notmuch.show': native.notmuch.show,
    'notmuch.config.get': native.notmuch.config.get,
    'native.exec': native.exec,
    'native.files.list': native.files.list,
    'native.files.move': native.files.move
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
    }).catch(error => response({error}));

    return true;
  }
});

// allow all modules to get the count's result
webext.runtime.on('message', (request, sender) => {
  native.policy(sender.tab.id, request.query);
}).if(({method}) => method === 'notmuch.count');

// browser-action
webext.browserAction.on('clicked', () => webext.tabs.single({
  url: '/data/client/index.html'
}));

// FAQs and Feedback
webext.runtime.on('start-up', () => {
  const {name, version, homepage_url} = webext.runtime.getManifest();
  const page = homepage_url; // eslint-disable-line camelcase
  // FAQs
  webext.storage.get({
    'version': null,
    'faqs': false,
    'last-update': 0,
  }).then(prefs => {
    if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
      const now = Date.now();
      const doUpdate = (now - prefs['last-update']) / 1000 / 60 / 60 / 24 > 30;
      webext.storage.set({
        version,
        'last-update': doUpdate ? Date.now() : prefs['last-update']
      }).then(() => {
        // do not display the FAQs page if last-update occurred less than 30 days ago.
        if (doUpdate) {
          const p = Boolean(prefs.version);
          webext.tabs.create({
            url: page + '?version=' + version +
              '&type=' + (p ? ('upgrade&p=' + prefs.version) : 'install'),
            active: p === false
          });
        }
      });
    }
  });
  // Feedback
  webext.runtime.setUninstallURL(
    page + '?rd=feedback&name=' + name + '&version=' + version
  );
});
