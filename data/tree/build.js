/* globals EventEmitter, VanillaTree */
'use strict';

var args = location.search.replace('?', '').split('&').reduce((p, c) => {
  const [key, value] = c.split('=');
  p[key] = decodeURIComponent(value);
  return p;
}, {});

var tree = new EventEmitter();

{
  const v = new VanillaTree('#root', {
    placeholder: 'Please wait...'
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

  tree.browse = path => new Promise((resolve, reject) => {
    // remove selection
    tree.select(false);

    const root = [];

    const once = () => {
      const id = root.shift();
      if (id) {
        // prevent communication until last child is ready
        tree.allow.transmit = root.length === 0;

        try {
          tree.select(id, root.length);
        }
        catch (e) {
          reject(e);
        }
      }
      else {
        tree.off('select', once);
        resolve();
      }
    };
    tree.on('select', once);

    let i = 0;
    tree.separate(path).forEach(s => {
      i += s.length;
      root.push(path.substr(0, i));
      i += 1;
    });
    once();
  });
  if (args.path) {
    tree.once('ready', () => tree.browse(args.path));
  }

  tree.build = (files, id) => {
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
    const extra = (id ? v.getChildList(id).querySelectorAll('li').length : 0);
    return dirs.length + extra;
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
          console.error(r);
        }
        else {
          const hasChild = tree.build(r.files, id);
          target.maildir = r.files.some(d => d.name === 'cur' || d.name === 'new' || d.name === 'tmp');
          if (hasChild) {
            v.open(id);
          }
          if (target.maildir) {
            tree.emit('maildir', id);
          }
          else if (r.files.some(f => f.name === 'query')) {
            target.dataset.smart = r.files.filter(f => f.name === 'query').shift().path;
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

  // toggle on "dblclick"
  v.container.addEventListener('dblclick', ({target}) => {
    if (target.classList.contains('vtree-leaf-label')) {
      target = target.closest('li');
      if (target.populated) {
        const id = target.dataset.vtreeId;
        v.toggle(id);
      }
    }
  });
}
