/* global webext */
'use strict';

webext.runtime.on('start-up', () => webext.contextMenus.batch([{
  id: 'badge-sync',
  title: 'Refresh badge (sync)',
  contexts: ['action']
}, {
  id: 'badge-no-sync',
  title: 'Refresh badge (no sync)',
  contexts: ['action']
}]));
