'use strict';

// Firefox loads old URLs!
document.getElementById('tree').src = '';
document.getElementById('list').src = '';

chrome.runtime.sendNativeMessage('com.add0n.node', {
  cmd: 'version'
}, r => {
  if (r) {
    document.getElementById('tree').src = '../tree/index.html';
    document.getElementById('search').src = '../search/index.html';
  }
  else {
    location.replace('/data/helper/index.html');
  }
});
