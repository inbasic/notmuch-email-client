/* globals utils, config, view, args */
'use strict';

if (args.plugins !== 'false') {
  utils.storage.get(null).then(prefs => {
    prefs = Object.assign({
      commands: []
    }, config, prefs);
    const extra = document.getElementById('extra');
    if (prefs.commands.length) {
      const li = document.createElement('li');
      li.classList.add('separator');
      extra.appendChild(li);
    }
    prefs.commands.forEach(command => {
      if (prefs[command] === undefined) {
        return console.log(command, 'is ignored (not defined)');
      }
      const {action, name, classList = [], alert, warn} = prefs[command];
      const exists = document.querySelector(`[data-cmd="${command}"]`);
      const li = exists ? exists : document.createElement('li');

      Object.assign(li.dataset, {
        action: action,
        cmd: 'user-action',
        alert: alert || '',
        warn: warn || ''
      });
      if (exists) {
        li.dataset.ocmd = command;
      }
      else {
        li.textContent = name || 'unknown action';
        classList.forEach(c => li.classList.add(c));
        extra.appendChild(li);
      }
    });
  });

  document.addEventListener('click', ({target}) => {
    const {cmd, alert, warn} = target.dataset;
    let action = target.dataset.action;

    const perform = () => utils.native.exec(action).then(r => {
      console.log(r);
      if (r.code !== 0 && alert === 'true' && window.top !== window) {
        window.top.api.user.alert({
          title: 'User Action Error',
          body: r.error.stderr
        });
      }
      // select all threads returned by the executable
      if (r.code === 0) {
        const threads = r.stdout.match(/thread:[^\s]*/g);
        if (threads && threads.length) {
          document.querySelector('[data-cmd="select-none"]').click();
          threads.forEach(thread => {
            const tr = document.querySelector(`[data-thread="${thread.replace('thread:', '')}"]`);
            if (tr) {
              tr.dataset.selected = true;
            }
          });
        }
      }
      view.emit('refresh', true);
    });

    if (cmd === 'user-action') {
      const threads = view.threads().map(id => 'thread:' + id).join(' ');
      (threads.length ? utils.files(threads) : Promise.resolve([])).then(files => {
        action = action
          .replace('[threads]', threads)
          .replace('[query]', args.query)
          .replace('[files]', files.join('\n'));

        if (action) {
          if (warn) {
            if (window.top === window) {
              console.log('this action is only available in the client mode');
            }
            else {
              window.top.api.user.confirm({
                title: 'Confirm',
                body: warn
              }).then(perform);
            }
          }
          else {
            perform();
          }
        }
        else {
          window.alert('"action" is empty! Use the options page to fix this.');
        }
      })
    }
  });
}
