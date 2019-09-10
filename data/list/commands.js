/* globals view, args, config, utils, undo */
'use strict';

view.threads = () => [...document.querySelectorAll('tr[data-selected="true"]')]
  .map(tr => tr.dataset.thread);

view.ids = () => [...document.querySelectorAll('tr[data-selected="true"]')]
  .map(tr => tr.dataset.query);

document.addEventListener('click', async e => {
  const {target, shiftKey} = e;
  const {cmd} = target.dataset;

  // to prevent unwanted actions while previous action is yet in progress
  if (
    cmd === 'mark-as-read' ||
    cmd === 'mark-as-unread' ||
    cmd === 'add-tags' ||
    cmd === 'trash' ||
    cmd === 'spam' ||
    cmd === 'archive' ||
    cmd === 'move-ok'
  ) {
    if (view.threads().length === 0) {
      return console.log('cannot act on an empty list');
    }
  }

  // fake actions
  if (view.threads().length && cmd) {
    utils.storage.get(config).then(prefs => {
      const fake = e.target.dataset.fake || prefs.fake[cmd] || '';

      if (fake.indexOf('hide') !== -1) {
        view.fake.remove();
      }

      if (fake.indexOf('unread') !== -1) {
        view.fake.unread();
      }
      else if (fake.indexOf('read') !== -1) {
        view.fake.read();
      }

      view.emit('update-toolbar');
    });
  }


  if (
    cmd === 'mark-as-read' ||
    cmd === 'mark-as-unread' ||
    cmd === 'toggle-flag' ||
    cmd === 'add-tags' ||
    cmd === 'trash' ||
    cmd === 'spam'
  ) {
    const options = {
      method: 'notmuch.tag',
      threads: view.threads(),
      tags: [],
      query: args.query // to perform on this view only not those ids that are not in this query
    };
    if (cmd === 'mark-as-read') {
      options.tags.push('-unread');
    }
    else if (cmd === 'mark-as-unread') {
      options.tags.push('+unread');
    }
    else if (cmd === 'add-tags') {
      const tags = await window.top.api.user.prompt({
        title: 'Tags',
        body: 'comma-separated list of new tags'
      });
      if (!tags) {
        return;
      }
      options.tags.push(...tags.split(/\s*,\s*/).map(s => '+' + s));
    }
    else if (cmd === 'trash') {
      options.tags.push('+deleted');
    }
    else if (cmd === 'spam') {
      options.tags.push('+spam');
    }
    else if (cmd === 'toggle-flag') {
      const tr = target.closest('tr');
      options.threads = [tr.dataset.thread];
      options.tags.push(tr.dataset.flagged === 'true' ? '+flagged' : '-flagged');
    }
    chrome.runtime.sendMessage(options, response => {
      if (response.error === undefined) {
        view.emit('refresh');
      }
    });
  }
  else if (cmd === 'copy-ids') {
    const threads = view.threads().map(id => 'thread:' + id);
    const list = threads.join(' ') + '\n\n' + view.ids().join();

    await utils.clipboard.copy(list);
    utils.notify(threads.length + ' threads(s) copied to the clipboard');
  }
  else if (cmd === 'copy-actions') {
    const str = JSON.stringify(undo.cache, null, 2);
    await utils.clipboard.copy(str);
    utils.notify(undo.cache.length + ' action(s) copied to the clipboard');
  }
  else if (cmd === 'copy-filenames') {
    const query = view.threads().map(id => 'thread:' + id).join(' ');
    utils.files(query).then(files => {
      utils.clipboard.copy(files.join('\n'));
      utils.notify(files.length + ' file(s) copied to the clipboard');
    }).catch(e => console.log(e));
  }
  else if (cmd === 'open') {
    if (window.top !== window) {
      const query = (shiftKey ? '' : args.query + ' ') + view.threads().map(id => 'thread:' + id).join(' ');
      window.top.api.popup.show('../show/index.html?query=' + encodeURIComponent(query));
    }
    e.stopPropagation();
  }
  else if (cmd === 'reply') {
    if (window.top !== window) {
      const query = view.ids().shift().split(/[,\s]/).shift();
      window.top.api.popup.show(
        '../reply/index.html?query=' +
        encodeURIComponent(query) +
        '&replyTo=' + (shiftKey ? 'all' : 'sender')
      );
    }
    e.stopPropagation();
  }
  else if (cmd === 'archive') {
    utils.storage.get(config).then(prefs => {
      const action = (prefs.archive ? prefs.archive.action : '')
        .replace('[threads]', view.threads().map(id => 'thread:' + id).join(' '))
        .replace('[query]', args.query);

      if (action) {
        utils.native.exec(action).then(() => view.emit('refresh', true));
      }
      else {
        window.alert('"action" is empty! Use the options page to fix this.');
      }
    });
  }
  else if (cmd === 'move-to') {
    view.browse.build();
    target.closest('.list').dataset.visible = true;
  }
  else if (cmd === 'move-cancel') {
    view.browse.destroy();
  }
  else if (cmd === 'move-ok') {
    const path = view.browse.destroy();
    if (path === undefined) {
      return window.alert('Please select the destination directory first');
    }
    const query = view.threads().map(id => 'thread:' + id).join(' ') + ' ' + args.query;
    utils.files(query).then(files => {
      utils.native.files.move(files, path)
        .then(() => utils.notmuch.new())
        .then(() => view.emit('refresh', true)).catch(e => console.error(e));
    });
  }
  else if (cmd === 'remove-tag') {
    e.preventDefault();
    const tag = target.closest('div').dataset.tag;
    const thread = target.closest('tr').dataset.thread;
    if (tag && thread) {
      chrome.runtime.sendMessage({
        method: 'notmuch.tag',
        threads: [thread],
        tags: ['-' + tag]
      }, response => {
        if (response.error === undefined) {
          view.emit('refresh');
        }
      });
    }
  }
  else if (cmd === 'refresh') {
    location.reload();
  }
});
chrome.runtime.onMessage.addListener(request => {
  if (request.method === 'list.refresh') {
    location.reload();
  }
});

// commands
document.getElementById('toolbar').addEventListener('click', ({target}) => {
  const cmd = target.dataset.cmd;
  if (cmd && cmd.startsWith('select-')) {
    [...document.querySelectorAll('#root tr')].forEach(tr => tr.dataset.selected = false);
  }
  if (cmd === 'select-all') {
    [...document.querySelectorAll('#root tr')].forEach(tr => tr.dataset.selected = true);
  }
  else if (cmd === 'select-read') {
    [...document.querySelectorAll('#root tr[data-unread="false"]')].forEach(tr => tr.dataset.selected = true);
  }
  else if (cmd === 'select-unread') {
    [...document.querySelectorAll('#root tr[data-unread="true"]')].forEach(tr => tr.dataset.selected = true);
  }
  else if (cmd === 'select-starred') {
    [...document.querySelectorAll('#root tr[data-flagged="true"]')].forEach(tr => tr.dataset.selected = true);
  }
  else if (cmd === 'select-unstarred') {
    [...document.querySelectorAll('#root tr[data-flagged="false"]')].forEach(tr => tr.dataset.selected = true);
  }
  if (cmd && cmd.startsWith('select-')) {
    view.emit('update-toolbar');
  }
});
document.getElementById('matched').addEventListener('input', ({target}) => {
  const empty = target.value === '';
  const value = target.value.toLowerCase().split(/\s+or\s+/).filter(s => s);
  [...document.querySelectorAll('#root tr')].forEach(tr => {
    if (empty) {
      tr.dataset.selected = false;
    }
    else {
      tr.dataset.selected = value.some(s => tr.textContent.toLowerCase().indexOf(s) !== -1);
    }
  });
  view.emit('update-toolbar');
});

view.on('selection-changed', () => {
  const count = document.querySelectorAll('#root [data-selected=true]').length;
  document.getElementById('selected').textContent = count ? `(${count})` : '';
});
