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
    chrome.windows.create({
      url: chrome.extension.getURL('data/installer/index.html'),
      width: 700,
      height: 500,
      left: screen.availLeft + Math.round((screen.availWidth - 600) / 2),
      top: screen.availTop + Math.round((screen.availHeight - 450) / 2),
      type: 'popup'
    }, () => window.close());
  }
});
