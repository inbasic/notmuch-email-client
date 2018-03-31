/* globals EventEmitter, webext, utils */
'use strict';

var api = new EventEmitter();
api.e = {
  tree: document.getElementById('tree'),
  popup: document.getElementById('popup'),
  search: document.getElementById('search')
};

/* use actions */
api.user = {};
api.user.alert = ({title, body}) => window.mscAlert(title, body);
api.user.confirm = ({title, body}) => new Promise(resolve => window.mscConfirm(title, body, resolve));
api.user.prompt = ({title, body}) => new Promise(resolve => window.mscPrompt(title, body, resolve));

/* search view */
api.search = {};
api.search.insert = query => {
  api.e.search.contentDocument.getElementById('search').value = query;
};

/* list view */
api.list = {};
{
  const list = document.getElementById('list');
  api.list.show = ({query, total = 0}) => {
    webext.storage.get({
      page: 50
    }).then(({page}) => {
      list.src = `/data/list/index.html?query=${encodeURIComponent(query)}&total=${total}&limit=${page}`;
      api.search.insert(query);
    });
  };
}

/* client view */
api.client = {};
api.client.title = s => document.title = s;

/* client view */
api.tree = {};
api.tree.select = id => api.e.tree.contentWindow.tree.select(id);

/* popup view */
api.popup = {};
{
  const hide = () => {
    api.e.popup.querySelector('iframe').src = 'about:blank';
    api.e.popup.classList.add('hide');
  };
  document.addEventListener('click', ({target}) => {
    if (target.id === 'popup') {
      hide();
    }
  });
  api.popup.hide = hide;
}
api.popup.show = src => {
  api.e.popup.querySelector('iframe').src = src;
  api.e.popup.classList.remove('hide');
};
// display errors
webext.runtime.on('message', request => api.user.alert({
  title: 'Error',
  body: request.error.stderr || request.error.message || JSON.stringify(request.error)
})).if(request => request.error);
// display logs
{
  let log = false;
  webext.runtime.on('message', request => console.log(request)).if(() => log);

  api.user.log = (...args) => log && console.log(...args);

  webext.storage.get({
    log
  }).then(prefs => log = prefs.log);
  webext.storage.on('changed', ps => log = ps.log.newValue).if(ps => ps.log);
}
