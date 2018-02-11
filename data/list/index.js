/* globals view */
'use strict';

// menu open and close
document.getElementById('toolbar').addEventListener('click', e => {
  const target = e.target;
  if (target.classList.contains('list')) {
    target.dataset.visible = target.dataset.visible === 'false';
  }
});
document.addEventListener('click', ({target}) => {
  const list = document.querySelector('.list[data-visible=true]');
  if (list && list !== target) {
    list.dataset.visible = false;
    list.dispatchEvent(new CustomEvent('hidden'));
    if (list.querySelector('[data-cmd="move-to"]')) {
      view.browse.destroy();
    }
  }
});

// select, flag and star
document.getElementById('root').addEventListener('click', e => {
  const target = e.target;
  const cmd = target.dataset.cmd;
  const tr = target.closest('tr');

  if (tr) {
    tr.querySelector('[data-id=active] input').click();
  }

  if (cmd === 'toggle-flag') {
    tr.dataset.flagged = tr.dataset.flagged !== 'true';
  }
  else if (tr && e.isTrusted) {
    tr.dataset.selected = tr.dataset.selected !== 'true';
    view.emit('update-toolbar');
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
