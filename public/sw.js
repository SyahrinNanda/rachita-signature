// Retire a service worker left by an earlier app on this origin.
// Rachita Sign does not cache PDF documents or register a service worker.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.registration.unregister());
});
