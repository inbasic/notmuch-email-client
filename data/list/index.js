/* globals view */
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
