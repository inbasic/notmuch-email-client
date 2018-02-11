/* globals webext */
'use strict';

var utils = {};

utils.clipboard = {};
utils.clipboard.copy = str => {
  document.oncopy = e => {
    e.clipboardData.setData('text/plain', str);
    e.preventDefault();
  };
  document.execCommand('Copy', false, null);
};

utils.files = query => new Promise((resolve, reject) => chrome.runtime.sendMessage({
  method: 'notmuch.search',
  output: 'files',
  query
}, r => {
  if (r.error) {
    reject(r.error);
  }
  else {
    resolve(r.responses);
  }
}));

utils.storage = webext.storage;

utils.notmuch = {};
utils.notmuch.new = query => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'notmuch.new',
  query
}, resolve));
utils.notmuch.count = query => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'notmuch.count',
  query
}, resolve));

utils.native = {};
utils.native.exec = action => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'native.exec',
  action
}, resolve));
utils.native.files = {};
utils.native.files.move = (files, dir) => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'native.files.move',
  files,
  dir
}, resolve));
