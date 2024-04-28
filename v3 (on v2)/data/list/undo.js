'use strict';

var undo = {
  cache: []
};

{ // save last 30 actions;
  const sendMessage = chrome.runtime.sendMessage;
  chrome.runtime.sendMessage = function(request) {
    if (request.method !== 'notmuch.search' && request.method !== 'notmuch.count') {
      undo.cache.push(request);
      undo.cache = undo.cache.slice(-30);
    }
    sendMessage.apply(this, arguments);
  };
}
