chrome.action = chrome.action || chrome.browserAction;
chrome.contextMenus.create = new Proxy(chrome.contextMenus.create, {
  apply(target, self, [properties, c]) {
    properties.contexts = properties.contexts.map(s => s === 'action' ? 'browser_action' : s);
    Reflect.apply(target, self, [properties, c]);
  }
});
