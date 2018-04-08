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

// select, flag and star
document.getElementById('root').addEventListener('click', e => {
  const target = e.target;

  const cmd = target.dataset.cmd;
  const tr = target.closest('tr');
  // change the active tr
  if (tr) {
    tr.querySelector('[data-id=active] input').click();
  }

  if (target.closest('[data-id="select"]')) { // skip checkbox
    // do with a delay
    return window.setTimeout(() => {
      if (e.defaultPrevented === false) {
        tr.dataset.selected = tr.dataset.selected !== 'true';
        view.emit('update-toolbar');
      }
    }, 50);
  }

  if (cmd === 'toggle-flag') {
    tr.dataset.flagged = tr.dataset.flagged !== 'true';
  }
  else if (tr && e.isTrusted) {
    const tr = target.closest('tr');
    const thread = tr.dataset.thread;

    if (window.top !== window) {
      window.top.api.popup.show('../show/index.html?query=thread:' + thread + ' ' + args.query);
    }
  }
});
