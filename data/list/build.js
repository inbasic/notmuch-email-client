/* globals EventEmitter, webext, utils */
'use strict';

var args = location.search.replace('?', '').split('&').reduce((p, c) => {
  const [key, value] = c.split('=');
  p[key] = decodeURIComponent(value);
  return p;
}, {});
args.limit = Math.min(Math.max(2, Number(args.limit || 50)), 300);
args.query = args.query || 'empty';
args.offset = Math.max(0, Number(args.offset || 0));
args.total = Number(args.total || 0);

// make sure the count is called, otherwise call it
var doCount;
if (args.total === 0 && args.query !== 'empty') {
  doCount = window.setTimeout(() => {
    utils.notmuch.count(args.query);
  }, 2000);
}

var view = new EventEmitter();
var tbody = document.getElementById('content');

view.browse = {
  watch: ({target}) => {
    const tree = target.contentWindow.tree;
    tree.on('select', id => {
      const {root, join} = tree;
      target.dataset.path = join(root, id, 'cur');
    });
  },
  build: () => {
    const li = document.querySelector('[data-cmd="move-to"]');
    li.dataset.active = true;
    const iframe = li.querySelector('iframe');
    iframe.src = '../tree/index.html?sandbox=true&plugins=false';
    iframe.addEventListener('load', view.browse.watch);
  },
  destroy: () => {
    const li = document.querySelector('[data-cmd="move-to"]');
    const iframe = li.querySelector('iframe');
    iframe.removeEventListener('load', view.browse.watch);
    iframe.src = 'about:blank';
    li.dataset.active = false;

    return iframe.dataset.path;
  }
};

view.add = entry => {
  const tr = document.getElementById('entry');
  const clone = document.importNode(tr.content, true);
  view.update(entry, clone.querySelector('tr'));
  tbody.appendChild(clone);
};

view.update = (entry, parent) => {
  parent.dataset.unread = entry.tags.indexOf('unread') !== -1;
  parent.dataset.thread = entry.thread;
  parent.dataset.flagged = entry.tags.indexOf('flagged') !== -1;
  const authors = parent.querySelector('[data-id="authors"]');
  authors.title = authors.textContent = entry.authors;
  parent.querySelector('[data-id="stat"]').textContent = entry.matched + '/' + entry.total;
  parent.querySelector('[data-id="subject"]>div:last-child').textContent = entry.subject;
  parent.querySelector('[data-id="subject"]').title = entry.subject;
  parent.querySelector('[data-id="date"]').textContent = entry['date_relative'];
  parent.querySelector('[data-id="tags"]').textContent = '';
  entry.tags.filter(t => t !== 'new' && t !== 'unread' && t !== 'flagged').forEach(tag => {
    const t = document.getElementById('tag');
    const clone = document.importNode(t.content, true);
    clone.querySelector('span').textContent = tag;
    clone.querySelector('div').dataset.tag = tag;
    parent.querySelector('[data-id="tags"]').appendChild(clone);
  });
};

{
  const newer = document.querySelector('[data-cmd="newer"]');
  const older = document.querySelector('[data-cmd="older"]');

  view.show = ({entries, start}) => {
    tbody.dataset.loading = false;
    entries.forEach(view.add);
    newer.start = start + entries.length;
    older.start = start - args.limit;
    older.disabled = older.start < 0;
    document.getElementById('start').textContent = start + 1;
    document.getElementById('end').textContent = newer.start;
    view.emit('update-toolbar');
  };
  {
    const search = ({target}) => {
      tbody.dataset.loading = true;
      newer.disabled = older.disabled = true;
      tbody.textContent = '';
      view.emit('search', target);
    };
    newer.addEventListener('click', search);
    older.addEventListener('click', search);
    document.addEventListener('DOMContentLoaded', () => search({
      target: {start: 0}
    }));
  }
}

view.on('search', ({start}) => {
  args.offset = start;
  document.title = 'Search results for "' + args.query + '"';
  chrome.runtime.sendMessage(Object.assign({
    method: 'notmuch.search'
  }, args), r => {
    if (r.error) {
      tbody.dataset.error = r.message || r.stderr || 'unexpected error!';
      tbody.dataset.loading = false;
    }
    else {
      view.show({
        total: r.total,
        start,
        entries: r.responses
      });
    }
  });
});

view.on('refresh', (count = false) => chrome.runtime.sendMessage(Object.assign({
  method: 'notmuch.search'
}, args), r => {
  if (r.error) {
    console.log(r);
  }
  else {
    const threads = r.responses.reduce((p, c) => {
      p[c.thread] = c;
      return p;
    }, {});
    // remove deleted threads
    [...document.querySelectorAll('#root tr')].filter(tr => threads[tr.dataset.thread] === undefined)
      .forEach(tr => tr.remove());
    // update rest
    [...document.querySelectorAll('tr')].forEach(tr => {
      const entry = threads[tr.dataset.thread];
      view.update(entry, tr);
      delete threads[tr.dataset.thread];
    });
    // create new elements
    Object.values(threads).forEach(view.add);
    // update "end"'s label
    document.getElementById('end').textContent = args.offset + r.responses.length;
    // update toolbar
    if (count) {
      utils.notmuch.count(args.query).then(() => view.emit('update-toolbar'));
    }
    else {
      view.emit('update-toolbar');
    }
  }
}));

{
  const older = document.querySelector('[data-cmd="older"]');
  const newer = document.querySelector('[data-cmd="newer"]');
  view.on('update-toolbar', () => {
    // update the "newer" button
    if (args.total) {
      newer.disabled = args.total <= newer.start || args.total === 0;
    }
    else {
      newer.disabled = true;
    }
    older.disabled = older.start < 0;
    // update commands
    document.body.dataset.selected = document.querySelector('#root [data-selected=true]') !== null;
    // update total count
    document.getElementById('total').textContent = args.total;
    // selection-changed
    view.emit('selection-changed');
  });
}

webext.runtime.on('message', ({total}) => {
  args.total = total;
  view.emit('update-toolbar');
  window.clearTimeout(doCount);
}).if(request => request.error === undefined && request.method === 'notmuch.count.response' && request.query === args.query);
