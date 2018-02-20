'use strict';

function parse(obj, html = true, parent = document.getElementById('content'), id = null) {
  if (Array.isArray(obj)) {
    return obj.filter(o => o).reverse().map(o => parse(o, html, parent, id));
  }
  else {
    if (obj['content-type'] === 'multipart/alternative' && obj.content.length === 2) {
      if (html) {
        return parse(obj.content.filter(o => o['content-type'] !== 'text/plain'), html, parent, id);
      }
      else {
        return parse(obj.content.filter(o => o['content-type'] === 'text/plain'), html, parent, id);
      }
    }
    if (obj['content-type'] === 'multipart/signed') {
      return obj.content.forEach(o => parse(o, html, parent, id));
    }
    if (obj.body) {
      return parse.headers(obj).then(section => {
        parent.appendChild(section.parent);
        parse(obj.body, html, section.body, obj.id);
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
        parse.images(doc.images.length);
        [...doc.childNodes].filter(node => node.nodeType !== 10)
          .forEach(node => parent.appendChild(node));
      }
      else if (
        obj['content-type'] === 'multipart/mixed' ||
        obj['content-type'] === 'multipart/related'
      ) {
        parse(obj.content, html, parent, id);
      }
      else {
        console.error('missed section!', obj);
      }
    }
    else {
      parse.attachment(obj, id);
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
  return Promise.resolve({parent, body});
};
parse.attachment = () => {};
parse.images = () => {};
