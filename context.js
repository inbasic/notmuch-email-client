/* globals webext, badge */
'use strict';

webext.contextMenus.batch([{
  id: 'badge-sync',
  title: 'Refresh badge (sync)',
  contexts: ['browser_action']
}, {
  id: 'badge-no-sync',
  title: 'Refresh badge (no sync)',
  contexts: ['browser_action']
}]);
