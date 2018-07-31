'use strict';

// apply user-styles
{
  const textContent = localStorage.getItem('client-css');
  if (textContent) {
    document.documentElement.appendChild(Object.assign(document.createElement('style'), {
      textContent
    }));
  }
}

// Firefox loads old URLs!
document.getElementById('tree').src = '';
document.getElementById('list').src = '';

chrome.runtime.sendNativeMessage('com.add0n.node', {
  cmd: 'version'
}, r => {
  if (r) {
    document.getElementById('tree').src = '../tree/index.html';
    document.getElementById('search').src = '../search/index.html';
    document.getElementById('list').src = '../list/empty.html';
  }
  else {
    location.replace('/data/helper/index.html');
  }
});
