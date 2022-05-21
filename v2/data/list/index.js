/* globals view, args */
'use strict';

// apply user-styles
{
  const textContent = localStorage.getItem('list-css');
  if (textContent) {
    document.documentElement.appendChild(Object.assign(document.createElement('style'), {
      textContent
    }));
  }
}

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
// shift + click a checkbox to multi-select
document.getElementById('root').addEventListener('mousedown', e => {
  if (e.shiftKey && e.target.closest('[data-id="select"]')) {
    const input = document.querySelector('#root input[type=radio]:checked');
    if (input) {
      const dtr = e.target.closest('tr');
      const str = input.closest('tr');
      if (dtr !== str) {
        let on = false;
        [...document.querySelectorAll('#root tr')].filter(tr => {
          if (tr === str || tr === dtr) {
            on = !on;
            return tr === str;
          }
          return on;
        }).forEach(tr => tr.dataset.selected = true);
      }
    }
  }
});
// select, flag and star
document.getElementById('root').addEventListener('click', e => {
  const target = e.target;

  const cmd = target.dataset.cmd;
  const tr = target.closest('tr');
  // change the active tr
  if (tr) {
    tr.querySelector('[data-id=active] input').click();
  }

  if (target.closest('[data-id="select"]')) {
    tr.dataset.selected = tr.dataset.selected !== 'true';
    view.emit('update-toolbar');
  }

  if (cmd === 'toggle-flag') {
    tr.dataset.flagged = tr.dataset.flagged !== 'true';
  }
  // cmd === undefined -> to prevent remove-tag from opening the show module
  else if (tr && e.isTrusted && cmd === undefined) {
    const tr = target.closest('tr');
    const thread = tr.dataset.thread;

    if (window.top !== window) {
      document.querySelector('[data-cmd=select-none]').click();
      tr.dataset.selected = true;
      view.emit('update-toolbar');
      document.querySelector('[data-cmd=open]').click();
    }
  }
});
