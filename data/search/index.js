/* globals utils */
'use strict';

// apply user-styles
{
  const textContent = localStorage.getItem('search-css');
  if (textContent) {
    document.documentElement.appendChild(Object.assign(document.createElement('style'), {
      textContent
    }));
  }
}

{
  const search = document.getElementById('search');
  const {api} = window.top;
  const form = document.querySelector('form');

  form.addEventListener('submit', e => {
    e.preventDefault();
    e.stopPropagation();

    if (search.value && window.top !== window) {
      api.tree.select(false);
      api.list.show({
        query: search.value
      }, 'search');

      utils.notmuch.count(search.value);

      api.client.title('Search results for "' + search.value + '"');
    }
  });
  const query = api.args.get('query');
  if (query) {
    search.value = decodeURIComponent(query);
    api.list.show({
      query: search.value
    }, 'search');
  }
}
