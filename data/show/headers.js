'use strict';

function humanFileSize(bytes) {
  const thresh = 1024;
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }
  const units = ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  let u = -1;
  do {
    bytes /= thresh;
    u += 1;
  }
  while (Math.abs(bytes) >= thresh && u < units.length - 1);

  return bytes.toFixed(1) + ' ' + units[u];
}

var resize = () => [...parent.document.querySelectorAll('iframe.headers')]
  .filter(iframe => iframe.contentWindow == window)
  .forEach(iframe => {
    iframe.style.height = iframe.contentDocument.documentElement.scrollHeight + 'px';
  });

window.addEventListener('message', ({data}) => {
  if (data.method === 'headers') {
    const {obj} = data;
    document.querySelector('[data-id=id]').textContent = obj.id;
    document.querySelector('[data-id=filename]').textContent =
      (Array.isArray(obj.filename) ? obj.filename : [obj.filename]).join(', ');
    document.querySelector('[data-id=date]').textContent = obj.headers.Date;
    document.querySelector('[data-id=from]').textContent = obj.headers.From;
    document.querySelector('[data-id=subject]').textContent = obj.headers.Subject;
    document.querySelector('[data-id=to]').textContent = obj.headers.To;
    document.querySelector('[data-id=tags]').textContent = obj.tags.join(', ');

    resize();
  }
  else if (data.method === 'attachment') {
    const {obj, id} = data;
    const span = document.createElement('span');
    span.obj = obj;
    span.href = '#';
    span.dataset.id = id;
    span.dataset.cmd = 'attachment';
    span.textContent = `${obj.filename} (${humanFileSize(obj['content-length'])})`;
    document.querySelector('[data-id=attachments]').appendChild(span);

    resize();
  }
});

document.addEventListener('click', ({target}) => {
  const cmd = target.dataset.cmd;

  if (cmd === 'attachment') {
    window.parent.get(target.dataset.id, target.obj).then(url => chrome.downloads.download({
      url,
      filename: target.obj.filename
    }));
  }
  else if (cmd === 'close-me') {
    if (window.top !== window) {
      window.top.api.popup.hide();
    }
  }
});
