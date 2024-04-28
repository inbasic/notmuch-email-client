window.resizeTo(0, 0);

window.onload = () => {
  const args = new URLSearchParams(window.location.search);
  const audio = new Audio(args.get('src'));

  audio.volume = Number(args.get('volume') || 100) / 100;
  audio.onended = function() {
    window.close();
  };
  audio.play();
};

chrome.runtime.onMessage.addListener(request => {
  if (request.method === 'close-audio') {
    window.close();
  }
});
