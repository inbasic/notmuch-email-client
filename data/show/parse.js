'use strict';

var get = (id, obj) => new Promise(resolve => chrome.runtime.sendMessage({
  method: 'notmuch.show',
  query: 'id:' + id,
  part: obj.id,
  format: 'raw',
  html: false
}, resolve));

function parse(obj, html = true, parent = document.body, attachments = null, id = null) {
  if (Array.isArray(obj)) {
    return obj.filter(o => o).reverse().map(o => parse(o, html, parent, attachments, id));
  }
  else {
    if (obj['content-type'] === 'multipart/alternative') {
      let body = [];
      if (html) {
        body = obj.content.filter(o => o['content-type'] !== 'text/plain');
      }
      body = body.length ? body : obj.content.filter(o => o['content-type'] === 'text/plain');

      if (body) {
        return parse(body, html, parent, attachments, id);
      }
    }
    if (obj['content-type'] === 'multipart/signed') {
      return obj.content.forEach(o => parse(o, html, parent, id));
    }
    if (obj.body) {
      return parse.headers(obj, parent).then(section => {
        parse(obj.body, html, section.body, section.attachments, obj.id);
      });
    }
    else if (obj.content) {
      if (obj['content-type'] === 'text/plain') {
        parent.appendChild(Object.assign(document.createElement('pre'), {
          textContent: obj.content.trim()
        }));
      }
      else if (obj['content-type'] === 'text/html') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(obj.content, 'text/html');
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

parse.headers = (obj, parent) => {
  const div = document.createElement('div');

  const headers = document.createElement('iframe');
  headers.classList.add('headers');

  const body = document.createElement('div');
  body.classList.add('body');

  return new Promise(resolve => {
    headers.addEventListener('load', () => {
      headers.contentWindow.postMessage({
        method: 'headers',
        obj
      }, '*');

      resolve({
        body,
        attachments: headers.contentWindow
      });
    });
    headers.src = 'headers.html';
    div.appendChild(headers);
    div.appendChild(body);
    parent.appendChild(div);
  });
};

{
  const cache = {};
  const postponed = {};

  parse.attachment = (obj, id, parent) => {
    parent.postMessage({
      method: 'attachment',
      obj,
      id
    }, '*');

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
    imgs.filter(i => i.src.startsWith('cid:')).forEach(img => {
      const id = img.src.replace('cid:', '');
      if (cache[id]) {
        get(cache[id].id, cache[id].obj).then(src => img.src = src);
      }
      else {
        postponed[id] = postponed[id] || [];
        postponed[id].push(img);
      }
      img.src = '';
    });
  };
}
