'use strict';

document.querySelector('form').addEventListener('submit', e => {
  e.preventDefault();
  const query = document.getElementById('search').value;

  if (query && window.top !== window) {
    const {api} = window.top;

    api.tree.select(false);
    api.list.show({
      query
    });
    api.client.title('Search results for "' + query + '"');
  }
});
