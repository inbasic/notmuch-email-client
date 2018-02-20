'use strict';

// apply user-styles
{
  const textContent = localStorage.getItem('tree-css');
  if (textContent) {
    document.documentElement.appendChild(Object.assign(document.createElement('style'), {
      textContent
    }));
  }
}
