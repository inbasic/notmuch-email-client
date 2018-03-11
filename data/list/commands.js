/* globals view, args, config, utils */
'use strict';

view.threads = () => [...document.querySelectorAll('tr[data-selected="true"]')]
  .map(tr => tr.dataset.thread);

document.addEventListener('click', async e => {
  const {target} = e;
  const cmd = target.dataset.cmd;

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
    const str = view.threads().map(id => 'thread:' + id).join(' ');
    utils.clipboard.copy(str);
  }
  else if (cmd === 'copy-filenames') {
    const query = view.threads().map(id => 'thread:' + id).join(' ');
    utils.files(query).then(files => {
      utils.clipboard.copy(files.join('\n'));
    }).catch(e => console.log(e));
  }
  else if (cmd === 'open') {
    if (window.top !== window) {
      window.top.api.popup.show('../show/index.html?query=' + view.threads().map(id => 'thread:' + id).join(' '));
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

view.on('selection-changed', () => {
  const count = document.querySelectorAll('#root [data-selected=true]').length;
  document.getElementById('selected').textContent = count ? `(${count})` : '';
});
