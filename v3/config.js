'use strict';

const config = {};

config.page = 50; // number of entries per page
config.log = false; // number of entries per page

config.sort = 'flagged'; // how the list is shown: flagged, subject,subject-za

config.delay = 2; // seconds
config.interval = 5; // minutes
config.command = '';

// reserved: 'trash', 'spam', 'mark-as-read', 'mark-as-unread', 'archive'
config.commands = [];

config.archive = {
  action: ''
};

config.reply = {
  action: '',
  accounts: []
};

config.cache = true; // try to cache command outputs instead of running the native

config.fake = {
  'mark-as-read': 'read',
  'mark-as-unread': 'unread',
  'open': 'read'
};
