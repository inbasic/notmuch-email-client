/* globals webext */
'use strict';

var utils = {};

utils.clipboard = {};
utils.clipboard.copy = str => new Promise(resolve => {
  document.oncopy = e => {
    e.clipboardData.setData('text/plain', str);
    e.preventDefault();
    resolve();
  };
  document.execCommand('Copy', false, null);
});

utils.notify = async(message) => {
  chrome.runtime.getBackgroundPage(bg => bg.webext.notifications.create({message}));
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

Object.defineProperty(utils, 'storage', {
  get() {
    return webext.storage;
  }
});

utils.notmuch = {};
utils.notmuch.new = query => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'notmuch.new',
  query
}, resolve));
utils.notmuch.count = query => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'notmuch.count',
  query
}, resolve));
utils.notmuch.tag = (query, tags) => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'notmuch.tag',
  query,
  tags
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
utils.native.files.file = (filename, content) => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'native.files.file',
  filename,
  content
}, resolve));
utils.native.files.remove = {};
utils.native.files.remove.file = path => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'native.files.remove.file',
  path
}, resolve));
utils.native.files.remove.directory = path => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'native.files.remove.directory',
  path
}, resolve));
