/* globals utils, config, args */
'use strict';
{
  const reply = document.getElementById('reply');

  reply.addEventListener('click', async() => {
    reply.disabled = true;
    // get content
    const body = document.getElementById('body').innerHTML;
    // create tmp file
    try {
      const {file, directory, error} = await utils.native.files.file('body.html', body);
      if (error) {
        throw error.stderr;
      }
      const prefs = await utils.storage.get(config);
      const action = (prefs.reply ? prefs.reply.action : '')
        .replace('[body]', file)
        .replace('[subject]', document.getElementById('Subject').value)
        .replace('[references]', document.getElementById('References').value)
        .replace('[in-reply-to]', document.getElementById('In-reply-to').value)
        .replace('[from]', document.getElementById('From').value)
        .replace('[to]', document.getElementById('To').value);
      if (action) {
        const r = await utils.native.exec(action);
        // clean up
        await utils.native.files.remove.file(file);
        await utils.native.files.remove.directory(directory);
        reply.disabled = false;
        if (r.code !== 0) {
          console.error(r);
          window.alert(r.error ? r.error.stderr : JSON.stringify(r, null, '  '));
        }
        else {
          console.log(r.stdout);
          utils.notmuch.tag(args.query, ['+replied']).then(() => {
            const {api} = window.top;
            if (api) {
              api.list.emit('refresh', true);
              api.popup.hide();
            }
          });
        }
      }
      else {
        window.alert('"action" is empty! Use the options page to fix this.');
      }
    }
    catch (e) {
      console.error(e);
      window.alert(e.message);
    }
  });
}
