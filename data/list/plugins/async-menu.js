'use strict';

var menu = function(options, callback) {
  const li = document.createElement('li');
  li.textContent = options.title;
  li.dataset.id = options.id;
  li.callback = callback;
  options.parent.appendChild(li);
  li.dataset.type = options.type || 'menuitem';
  if (options.type === 'menu') {
    li.closest('.list').addEventListener('hidden', () => {
      li.textContent = options.title;
      li.addEventListener('mouseenter', menu.build);
    });

    li.addEventListener('mouseenter', menu.build);
  }
  options.parent.appendChild(li);
};

menu.build = ({target}) => {
  target.dataset.loading = true;
  target.removeEventListener('mouseenter', menu.build);
  const div = document.createElement('div');
  div.classList.add('list', 'dynamic-list');
  div.dataset.visible = true;
  const ul = document.createElement('ul');

  target.appendChild(div);
  target.callback(target.dataset.id).then(arr => {
    div.appendChild(ul);
    target.dataset.loading = false;
    arr.forEach(o => {
      if (o.type === 'menu') {
        o.parent = ul;
        menu(o, target.callback);
      }
      else {
        const li = document.createElement('li');
        li.textContent = o.title;
        ul.appendChild(li);
      }
    });
  });
};

menu({
  title: 'This is a menu',
  id: 'test',
  parent: document.getElementById('extra'),
  type: 'menu'
}, id => new Promise(resolve => {
  window.setTimeout(() => resolve([{
    title: '1',
    id: '1',
    type: 'menuitem'
  },
  {
    title: '2',
    id: '2',
    type: 'menuitem'
  },
  {
    title: '3',
    id: '3',
    type: 'menu'
  }]), 2000);
}));
