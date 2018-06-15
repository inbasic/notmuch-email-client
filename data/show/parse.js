'use strict';

var parse = function(json) {
  const parts = [];

  function step(json) {
    if (Array.isArray(json)) {
      return json.filter(o => o).reverse().map(step);
    }
    const type = (json['content-type'] || '').toLowerCase();
    // is this a multipart object
    if (type) {
      if (type === 'multipart/alternative') {
        let body = [];
        json.content.forEach(o => o['content-type'] = o['content-type'].toLowerCase());
        body = json.content.filter(o => o['content-type'] !== 'text/plain');
        body = body.length ? body : json.content.filter(o => o['content-type'] === 'text/plain');
        if (body) {
          return step(body);
        }
      }
      if (type.startsWith('multipart/')) {
        return step(json.content);
      }
    }
    // can we extract headers
    if (json.body) {
      const flat = a => a.reduce((acc, val) => (Array.isArray(val) ? acc.concat(flat(val)) : acc.concat(val)), []);
      const tmp = flat(step(json.body));
      parts.push({
        headers: Object.assign(json.headers, {
          id: json.id,
          filename: json.filename,
          tags: json.tags
        }),
        bodies: tmp.filter(o => o.html || o.text),
        attachments: tmp.filter(o => o.attachment)
      });
    }
    // can we extract email's body
    else if (json.content) {
      if (type === 'text/html') {
        return {
          html: json.content
        };
      }
      if (type === 'text/plain') {
        return {
          text: json.content
        };
      }
      console.log('missed section', json);
    }
    else {
      return {
        attachment: json
      };
    }
  }
  step(json);

  return parts;
};

parse.humanFileSize = bytes => {
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
};

parse.iframe = ({
  type = 'safe',
  iframe,
  part
}, callback = () => {}) => {
  const insert = iframe === undefined;
  if (!iframe) {
    iframe = document.createElement('iframe');
  }
  if (part) {
    iframe.part = part;
  }
  else {
    part = iframe.part;
  }
  iframe.sandbox = 'allow-same-origin allow-popups';
  iframe.style.height = '30px';
  const onload = () => {
    const doc = iframe.contentDocument;
    const body = doc.body;

    const resize = () => {
      iframe.style.height = doc.documentElement.scrollHeight + 'px';
    };

    const ro = typeof ResizeObserver !== 'undefined' ?
      new ResizeObserver(resize) :
      {observe: () => {}, disconnect: () => {}};
    ro.observe(doc.scrollingElement);

    let remote = false;
    part.bodies.forEach(o => {
      if (o.text) {
        body.appendChild(Object.assign(document.createElement('pre'), {
          textContent: o.text.trim()
        }));
      }
      else if (o.html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(o.html, 'text/html');
        [...doc.images].forEach(img => {
          if (type === 'safe') {
            img.title = img.src;
          }
          if (img.src.startsWith('cid:')) {
            const o = part.attachments.filter(o => 'cid:' + o.attachment['content-id'] === img.src).shift();
            if (o) {
              chrome.runtime.sendMessage({
                method: 'notmuch.show',
                query: 'id:' + part.headers.id,
                part: o.attachment.id,
                format: 'raw',
                html: false
              }, url => img.src = url);
            }
          }
          else if (type === 'safe') {
            img.src = 'image.svg';
            remote = true;
          }
        });
        [...doc.childNodes].filter(node => node.nodeType !== 10)
          .forEach(node => body.appendChild(node));
        //
      }
      resize();
    });
    if (body.children.length === 0) {
      body.classList.add('empty');
    }
    // unload
    iframe.removeEventListener('load', onload);
    // callback
    callback(remote);
  };
  iframe.addEventListener('load', onload);
  iframe.src = type === 'safe' ? 'body.html' : 'body-unsafe.html';
  if (insert) {
    document.getElementById('content').appendChild(iframe);
  }
};

parse.insert = parts => {
  const part = parts.shift();
  if (part) {
    // insert headers
    const headers = part.headers;
    const t = document.getElementById('headers');
    const clone = document.importNode(t.content, true);
    const table = clone.querySelector('table');
    clone.querySelector('[data-id=id]').textContent = headers.id;
    clone.querySelector('[data-id=filename]').textContent =
      (Array.isArray(headers.filename) ? headers.filename : [headers.filename]).join(', ');
    clone.querySelector('[data-id=date]').textContent = headers.Date;
    clone.querySelector('[data-id=from]').textContent = headers.From;
    clone.querySelector('[data-id=subject]').textContent = headers.Subject;
    clone.querySelector('[data-id=to]').textContent = headers.To;
    clone.querySelector('[data-id=tags]').textContent = headers.tags.join(', ');
    // attachments
    part.attachments.forEach(({attachment}) => {
      const span = document.createElement('span');
      span.attachment = attachment;
      span.href = '#';
      span.dataset.id = part.headers.id;
      span.dataset.cmd = 'attachment';
      span.textContent = `${attachment.filename} (${parse.humanFileSize(attachment['content-length'])})`;
      clone.querySelector('[data-id=attachments]').appendChild(span);
    });

    document.getElementById('content').appendChild(clone);

    return parse.iframe({part}, remote => {
      table.dataset.type = remote ? 'remote' : 'local';
      parse.insert(parts);
    });
  }
};
parse.reload = iframe => parse.iframe({
  type: 'unsafe',
  iframe
});
