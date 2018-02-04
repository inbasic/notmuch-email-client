'use strict';

var config = {};

config.page = 50; // number of entries per page
config.log = false; // number of entries per page

config.delay = 2; // seconds
config.interval = 5; //minutes
config.command = '/Volumes/emails/badge.sh';

// reserved: 'trash', 'spam', 'mark-as-read', 'mark-as-unread', 'archive'
config.commands = ['delete', 'clean', 'real-delete', 'archive'];
config.delete = {
  name: 'Move deleted to Trash',
  action: '/Volumes/emails/trash.sh',
  classList: [], // 'selection'
  alert: true
};
config.archive = {
  action: '/Volumes/emails/archive.sh [threads] [query]'
};
config.clean = {
  name: 'Remove .DS_Store files',
  action: '/Volumes/emails/clean.sh',
  alert: false
};
config['real-delete'] = {
  name: 'Real delete',
  action: '/Volumes/emails/delete.sh [threads] [query]',
  alert: true,
  classList: ['selection'],
  warn: 'This will permanently delete all selected emails. Are you sure?'
};
