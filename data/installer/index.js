let os = 'windows';
if (navigator.userAgent.indexOf('Mac') !== -1) {
  os = 'mac';
}
document.body.dataset.os = os;

const config = {
  link: {
    windows: 'https://github.com/andy-portmen/native-client/releases/download/0.7.0/windows.zip',
    mac:     'https://github.com/andy-portmen/native-client/releases/download/0.7.0/mac.zip',
    linux:   'https://github.com/andy-portmen/native-client/releases/download/0.7.0/linux.zip'
  }
};

if (os === 'mac' || os === 'windows') {
  document.getElementById('package').href = config.link[os];
  document.getElementById('package').download = os + '.zip';
  document.getElementById('uninstall').textContent = 'uninstall.' + (os === 'windows' ? 'bat' : 'sh');
}
else {
  alert('Your operating system is not yet supported');
}

fetch('https://api.github.com/repos/andy-portmen/native-client/releases/latest').then(r => r.json()).then(obj => {
  const link = obj.assets.filter(a => a.name === os + '.zip')[0].browser_download_url;
  document.getElementById('package').href = link;
}).catch(e => alert(e.message));

chrome.runtime.sendNativeMessage('com.add0n.node', {
  method: 'version'
}, r => {
  chrome.runtime.lastError;
  if (r) {
    document.getElementById('installed').style.display = 'flex';
  }
});
document.getElementById('restart').addEventListener('click', () => {
  chrome.runtime.reload();
});
