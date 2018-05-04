'use strict';

document.getElementById('close-me').addEventListener('click', () => {
  if (window.top !== window) {
    window.top.api.popup.hide();
  }
});

{
  const commands = [{
    'cmd': 'backColor',
    'val': 'red',
    'desc': 'Changes the document background color. In styleWithCss mode, it affects the background color of the containing block instead. This requires a color value string to be passed in as a value argument. (Internet Explorer uses this to set text background color.)'
  }, {
    'cmd': 'bold',
    'desc': 'Toggles bold on/off for the selection or at the insertion point. (Internet Explorer uses the STRONG tag instead of B.)'
  }, {
    'cmd': 'contentReadOnly',
    'desc': 'Makes the content document either read-only or editable. This requires a boolean true/false to be passed in as a value argument. (Not supported by Internet Explorer.)'
  }, {
    'cmd': 'createLink',
    'val': 'https://example.com/',
    'desc': 'Creates an anchor link from the selection, only if there is a selection. This requires the HREF URI string to be passed in as a value argument. The URI must contain at least a single character, which may be a white space. (Internet Explorer will create a link with a null URI value.)'
  }, {
    'cmd': 'decreaseFontSize',
    'desc': 'Adds a SMALL tag around the selection or at the insertion point. (Not supported by Internet Explorer.)'
  }, {
    'cmd': 'enableInlineTableEditing',
    'desc': 'Enables or disables the table row and column insertion and deletion controls. (Not supported by Internet Explorer.)'
  }, {
    'cmd': 'enableObjectResizing',
    'desc': 'Enables or disables the resize handles on images and other resizable objects. (Not supported by Internet Explorer.)'
  }, {
    'cmd': 'fontName',
    'val': 'Inconsolata, monospace',
    'desc': 'Changes the font name for the selection or at the insertion point. This requires a font name string (\'Arial\' for example) to be passed in as a value argument.'
  }, {
    'cmd': 'fontSize',
    'val': '1-7',
    'desc': 'Changes the font size for the selection or at the insertion point. This requires an HTML font size (1-7) to be passed in as a value argument.'
  }, {
    'cmd': 'foreColor',
    'val': 'rgba(0,0,0,.5)',
    'desc': 'Changes a font color for the selection or at the insertion point. This requires a color value string to be passed in as a value argument.'
  }, {
    'cmd': 'formatBlock',
    'val': '<blockquote>',
    'desc': 'Adds an HTML block-style tag around the line containing the current selection, replacing the block element containing the line if one exists (in Firefox, BLOCKQUOTE is the exception - it will wrap any containing block element). Requires a tag-name string to be passed in as a value argument. Virtually all block style tags can be used (eg. \'H1\', \'P\', \'DL\', \'BLOCKQUOTE\'). (Internet Explorer supports only heading tags H1 - H6, ADDRESS, and PRE, which must also include the tag delimiters &lt; &gt;, such as \'&lt;H1&gt;\'.)'
  }, {
    'cmd': 'heading',
    'val': 'h3',
    'desc': 'Adds a heading tag around a selection or insertion point line. Requires the tag-name string to be passed in as a value argument (i.e. \'H1\', \'H6\'). (Not supported by Internet Explorer and Safari.)'
  }, {
    'cmd': 'hiliteColor',
    'val': 'Orange',
    'desc': 'Changes the background color for the selection or at the insertion point. Requires a color value string to be passed in as a value argument. UseCSS must be turned on for this to function. (Not supported by Internet Explorer.)'
  }, {
    'cmd': 'increaseFontSize',
    'desc': 'Adds a BIG tag around the selection or at the insertion point. (Not supported by Internet Explorer.)'
  }, {
    'cmd': 'indent',
    'desc': 'Indents the line containing the selection or insertion point. In Firefox, if the selection spans multiple lines at different levels of indentation, only the least indented lines in the selection will be indented.'
  }, {
    'cmd': 'insertBrOnReturn',
    'desc': 'Controls whether the Enter key inserts a br tag or splits the current block element into two. (Not supported by Internet Explorer.)'
  }, {
    'cmd': 'insertHorizontalRule',
    'desc': 'Inserts a horizontal rule at the insertion point (deletes selection).'
  }, {
    'cmd': 'insertHTML',
    'val': '<h3>Notmuch Email Client!</h3>',
    'desc': 'Inserts an HTML string at the insertion point (deletes selection). Requires a valid HTML string to be passed in as a value argument. (Not supported by Internet Explorer.)'
  }, {
    'cmd': 'insertImage',
    'val': 'http://dummyimage.com/160x90',
    'desc': 'Inserts an image at the insertion point (deletes selection). Requires the image SRC URI string to be passed in as a value argument. The URI must contain at least a single character, which may be a white space. (Internet Explorer will create a link with a null URI value.)'
  }, {
    'cmd': 'insertOrderedList',
    'desc': 'Creates a numbered ordered list for the selection or at the insertion point.'
  }, {
    'cmd': 'insertUnorderedList',
    'desc': 'Creates a bulleted unordered list for the selection or at the insertion point.'
  }, {
    'cmd': 'insertParagraph',
    'desc': 'Inserts a paragraph around the selection or the current line. (Internet Explorer inserts a paragraph at the insertion point and deletes the selection.)'
  }, {
    'cmd': 'insertText',
    'val': new Date(),
    'desc': 'Inserts the given plain text at the insertion point (deletes selection).'
  }, {
    'cmd': 'italic',
    'desc': 'Toggles italics on/off for the selection or at the insertion point. (Internet Explorer uses the EM tag instead of I.)'
  }, {
    'cmd': 'justifyCenter',
    'desc': 'Centers the selection or insertion point.'
  }, {
    'cmd': 'justifyFull',
    'desc': 'Justifies the selection or insertion point.'
  }, {
    'cmd': 'justifyLeft',
    'desc': 'Justifies the selection or insertion point to the left.'
  }, {
    'cmd': 'justifyRight',
    'desc': 'Right-justifies the selection or the insertion point.'
  }, {
    'cmd': 'outdent',
    'desc': 'Outdents the line containing the selection or insertion point.'
  }, {
    'cmd': 'paste',
    'desc': 'Pastes the clipboard contents at the insertion point (replaces current selection). Clipboard capability must be enabled in the user.js preference file. See'
  }, {
    'cmd': 'removeFormat',
    'desc': 'Removes all formatting from the current selection.'
  }, {
    'cmd': 'strikeThrough',
    'desc': 'Toggles strikethrough on/off for the selection or at the insertion point.'
  }, {
    'cmd': 'subscript',
    'desc': 'Toggles subscript on/off for the selection or at the insertion point.'
  }, {
    'cmd': 'superscript',
    'desc': 'Toggles superscript on/off for the selection or at the insertion point.'
  }, {
    'cmd': 'underline',
    'desc': 'Toggles underline on/off for the selection or at the insertion point.'
  }, {
    'cmd': 'unlink',
    'desc': 'Removes the anchor tag from a selected anchor link.'
  }, {
    'cmd': 'useCSS ',
    'desc': 'Toggles the use of HTML tags or CSS for the generated markup. Requires a boolean true/false as a value argument. NOTE: This argument is logically backwards (i.e. use false to use CSS, true to use HTML). (Not supported by Internet Explorer.) This has been deprecated; use the styleWithCSS command instead.'
  }];

  const tools = document.getElementById('tools');
  commands.forEach(({cmd, desc}, id) => {
    if (document.queryCommandSupported(cmd)) {
      const input = document.createElement('input');
      input.value = cmd;
      input.type = 'button';
      input.title = desc;
      input.dataset.id = id;
      tools.appendChild(input);
    }
  });
  tools.addEventListener('click', ({target}) => {
    const id = target.dataset.id;

    if (id) {
      const {cmd, val} = commands[Number(id)];

      const user = (typeof val !== 'undefined') ? prompt('Value for ' + cmd + '?', val) : '';
      document.execCommand(cmd, false, user);
    }
  });
}
