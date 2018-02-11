/* globals EventEmitter, VanillaTree, tree */
'use strict';

var args = location.search.replace('?', '').split('&').reduce((p, c) => {
  const [key, value] = c.split('=');
  p[key] = decodeURIComponent(value);
  return p;
}, {});

var tree = new EventEmitter();

{
  const v = new VanillaTree('#root', {
    placeholder: 'Please wait...',
  });
  // cache
  const cache = [];

  tree.leaf = id => {
    try {
      return v.getLeaf(id);
    }
    catch (e) {
      return null;
    }
  };

  tree.separate = s => s.split(new RegExp(tree.separate.reg));
  tree.separate.reg = '[./\\\\]';
  tree.join = (...parts) => parts.join('/').replace(/\/\//g, '/');

  tree.build = files => {
    let dirs = files
      .filter(o => o.dir && o.name[0] !== '.')
      .filter(o => o.name !== 'cur' && o.name !== 'new' && o.name !== 'tmp');
    // prepare
    dirs = dirs.map(dir => Object.assign(dir, {
      label: dir.name,
      id: dir.path.replace(tree.root, '')
    }));

    dirs.forEach(dir => cache.push(dir.id));
    // put in categories
    const list = {};
    dirs.forEach(dir => {
      const spl = tree.separate(dir.id);
      const n = spl.length;
      list[n] = list[n] || [];
      if (n > 1) {
        const pid = dir.id.replace(
          new RegExp(tree.separate.reg + spl[n - 1] + '$'),
          ''
        );
        if (cache.indexOf(pid) !== -1) {
          dir.parent = pid;
          dir.label = spl[n - 1];
        }
      }
      list[n].push(dir);
    });
    Object.keys(list).forEach(k => {
      list[k].forEach(dir => {
        v.add(dir);
      });
    });

    return dirs.length;
  };

  chrome.runtime.sendMessage({
    method: 'notmuch.config.get',
    name: 'database.path'
  }, r => {
    if (r.error) {
      document.querySelector('.vtree-placeholder').textContent = 'Error: ' + JSON.stringify(r.error);
    }
    else {
      tree.root = r.stdout;
      chrome.runtime.sendMessage({
        method: 'native.files.list',
        root: tree.root
      }, r => {
        if (r.error) {
          document.querySelector('.vtree-placeholder').textContent = 'Error: ' + JSON.stringify(r.error);
        }
        else {
          tree.build(r.files);
          tree.emit('ready');
        }
      });
    }
  });

  v.container.addEventListener('vtree-open', ({detail: {id}}) => tree.emit('open', id));

  v.container.addEventListener('vtree-select', ({target, detail: {id}}) => {
    if (!target.populated) {
      chrome.runtime.sendMessage({
        method: 'native.files.list',
        root: tree.root,
        path: id
      }, r => {
        if (r.error) {
          console.log(r);
        }
        else {
          const hasChild = tree.build(r.files);
          target.maildir = r.files.some(d => d.name === 'cur' || d.name === 'new' || d.name === 'tmp');

          if (hasChild) {
            v.open(id);
          }
          if (target.maildir) {
            tree.emit('maildir', id);
          }
          tree.emit('select', id);
        }
      });
      target.populated = true;
    }
    else {
      tree.emit('select', id);
      if (target.maildir) {
        tree.emit('maildir', id);
      }
    }
  });

  tree.select = (id, open = false) => {
    if (id === false) {
      const selected = document.querySelector('.vtree-selected');
      if (selected) {
        selected.classList.remove('vtree-selected');
      }
    }
    else {
      if (open) {
        v.open(id);
      }
      v.select(id);
    }
  };
}
