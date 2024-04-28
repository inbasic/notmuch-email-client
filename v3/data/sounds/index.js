let timeout;

chrome.runtime.onMessage.addListener(request => {
  if (request.target === 'offscreen' && request.method === 'play') {
    const audio = new Audio(request.src);
    audio.volume = request.volume / 100;
    audio.onended = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => window.close(), 1000);
    };
    audio.play();
  }
});
