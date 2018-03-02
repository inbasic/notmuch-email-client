/* globals get */
'use strict';

function parse(obj, html = true, parent = document.getElementById('content'), attachments = null, id = null) {
  if (Array.isArray(obj)) {
    return obj.filter(o => o).reverse().map(o => parse(o, html, parent, attachments, id));
  }
  else {
    if (obj['content-type'] === 'multipart/alternative' && obj.content.length === 2) {
      if (html) {
        return parse(obj.content.filter(o => o['content-type'] !== 'text/plain'), html, parent, attachments, id);
      }
      else {
        return parse(obj.content.filter(o => o['content-type'] === 'text/plain'), html, parent, attachments, id);
      }
    }
    if (obj['content-type'] === 'multipart/signed') {
      return obj.content.forEach(o => parse(o, html, parent, id));
    }
    if (obj.body) {
      return parse.headers(obj).then(section => {
        parent.appendChild(section.parent);
        parse(obj.body, html, section.body, section.attachments, obj.id);
      });
    }
    else if (obj.content) {
      if (obj['content-type'] === 'text/plain') {
        parent.appendChild(Object.assign(document.createElement('pre'), {
          textContent: obj.content
        }));
      }
      else if (obj['content-type'] === 'text/html') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(obj.content, 'text/html');
        [...doc.images].forEach(img => {
          img.dataset.src = img.src;
          img.src = '';
        });
        parse.images([...doc.images]);
        [...doc.childNodes].filter(node => node.nodeType !== 10)
          .forEach(node => parent.appendChild(node));
      }
      else if (
        obj['content-type'] === 'multipart/mixed' ||
        obj['content-type'] === 'multipart/related'
      ) {
        parse(obj.content, html, parent, attachments, id);
      }
      else {
        console.error('missed section!', obj);
      }
    }
    else {
      parse.attachment(obj, id, attachments);
    }
  }
}

parse.headers = obj => {
  const parent = document.createElement('div');

  const ce = document.getElementById('header');
  const header = document.importNode(ce.content, true);
  header.querySelector('[data-id=id]').textContent = obj.id;
  header.querySelector('[data-id=filename]').textContent = obj.filename.join(', ');
  header.querySelector('[data-id=date]').textContent = obj.headers.Date;
  header.querySelector('[data-id=from]').textContent = obj.headers.From;
  header.querySelector('[data-id=subject]').textContent = obj.headers.Subject;
  header.querySelector('[data-id=to]').textContent = obj.headers.To;
  header.querySelector('[data-id=tags]').textContent = obj.tags.join(', ');
  parent.appendChild(header);

  const body = document.createElement('div');
  body.classList.add('body');

  parent.appendChild(body);
  return Promise.resolve({
    parent,
    body,
    attachments: parent.querySelector('[data-id=attachments]')
  });
};

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

{
  const cache = {};
  const postponed = {};

  parse.attachment = (obj, id, parent) => {
    const span = document.createElement('span');
    span.obj = obj;
    span.href = '#';
    span.dataset.id = id;
    span.dataset.cmd = 'attachment';
    span.textContent = `${obj.filename} (${humanFileSize(obj['content-length'])})`;
    parent.appendChild(span);
    const cid = obj['content-id'];
    if (cid) {
      cache[cid] = {obj, id};
      if (postponed[cid]) {
        get(id, obj).then(src => {
          postponed[cid].forEach(img => img.src = src);
          delete postponed[id];
        });
      }
    }
  };
  parse.images = imgs => {
    imgs.filter(i => i.dataset.src.startsWith('cid:')).forEach(img => {
      const id = img.dataset.src.replace('cid:', '');
      if (cache[id]) {
        get(cache[id].id, cache[id].obj).then(src => img.src = src);
      }
      else {
        postponed[id] = postponed[id] || [];
        postponed[id].push(img);
      }
      delete img.dataset.src;
    });
  };
}
