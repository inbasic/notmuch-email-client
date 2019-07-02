/* globals EventEmitter, webext */
'use strict';


var api = new EventEmitter();
api.e = {
  tree: document.getElementById('tree'),
  popup: document.getElementById('popup'),
  search: document.getElementById('search')
};

chrome.runtime.connect({
  name: 'client'
});

api.args = new URLSearchParams(location.search);

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
  api.list.show = async ({query, total = 0}, reason) => {
    query = Array.isArray(query) ? query : [query];
    // remove old unused list views
    // the first iframe is not a data-id=list
    [...document.querySelectorAll('[data-id=list]')].slice(query.length - 1).forEach(f => f.remove());
    // add new ones
    for (let i = 0; i < query.length; i += 1) {
      const iframe = i === 0 ? list : (() => {
        let iframe = document.querySelector(`iframe[data-index="${i}"]`);
        if (iframe) {
          return iframe;
        }
        iframe = document.createElement('iframe');
        iframe.dataset.id = 'list';
        iframe.dataset.index = i;
        list.parentElement.appendChild(iframe);
        return iframe;
      })();
      const {page, sort} = await webext.storage.get({
        page: 50,
        sort: 'flagged'
      });
      iframe.src = '/data/list/index.html?query=' +
        `${encodeURIComponent(query[i])}&total=${total}&limit=${page}&sort=${sort}`;
      api.search.insert(query[i]);

      if (reason === 'search') {
        history.replaceState({}, '', '?query=' + encodeURIComponent(query));
      }
      else {
        history.replaceState({}, '', '?');
      }
    }
  };
  api.list.emit = name => list.contentWindow.view.emit(name);
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
    window.frames['popup'].location = 'about:blank';
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
  window.frames['popup'].location = src;
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
