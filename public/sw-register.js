
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.log('Service Worker registered with scope:', registration.scope);
      // You can add logic here to prompt the user to update if a new SW is available.
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
               console.log('New content is available; please refresh.');
               // Here you could show a toast or a button to the user
            }
          });
        }
      });
    })
    .catch((error) => {
      console.error('Service Worker registration failed:', error);
    });
}
