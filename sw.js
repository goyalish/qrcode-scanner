const version = 1.2;
const cacheName = `MyCacheName ${version}`;
const libScripts = [
  'lib/grid.js',
  'lib/version.js',
  'lib/detector.js',
  'lib/formatinf.js',
  'lib/errorlevel.js',
  'lib/bitmat.js',
  'lib/datablock.js',
  'lib/bmparser.js',
  'lib/datamask.js',
  'lib/rsdecoder.js',
  'lib/gf256poly.js',
  'lib/gf256.js',
  'lib/decoder.js',
  'lib/qrcode.js',
  'lib/findpat.js',
  'lib/alignpat.js',
  'lib/databr.js'
];
const onsenUI = [
  'https://unpkg.com/onsenui@2.11.2/css/onsen-css-components.min.css',
  'https://unpkg.com/onsenui@2.11.2/css/onsenui-core.min.css',
  'https://unpkg.com/onsenui@2.11.2/css/onsenui.min.css',
  'https://unpkg.com/onsenui@2.11.2/js/onsenui.min.js',
  'https://unpkg.com/onsenui@2.11.2/css/material-design-iconic-font/css/material-design-iconic-font.min.css',
  'https://unpkg.com/onsenui@2.11.2/css/material-design-iconic-font/fonts/Material-Design-Iconic-Font.woff2'
];
const filesToCache = ["https://goyalish.github.io/qrcode-scanner/", "main.css", "index.html", "capture.js", ...libScripts, ...onsenUI];
const broadcast = new BroadcastChannel('my-channel');

self.importScripts(...libScripts);

const processImage = (data) => {
  let result = false;
  try {
    qrcode.width = data.width;
    qrcode.height = data.height;
    qrcode.imagedata = data.imageData;

    result = qrcode.process();

    broadcast.postMessage({ type: 'processImage', result });
  } catch (e) {
    // console.error(e);
  }
};

broadcast.onmessage = (event) => {
  if (event.data && event.data.type === 'processImage') {
    processImage(event.data.data);
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then(async (cache) => {
    for (const file of filesToCache) {
      try {
        await cache.add(file);
      } catch(e) {
        console.error(file, e);
      }
    }
  }));
  console.log("Service Worker installed...");
});

self.addEventListener("fetch", (event) => {
  console.log(event.request.url, new Date());
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;

      // Fallback to network and if it fails, return the offline page.
      return fetch(event.request).catch((error) => {
        console.log('Network error...', error);
        console.log('Attempting Offline fallback.');
        return caches.open(cacheName).then((cache) => {
          return cache.match("offline.html");
        });
      });
    })
  );
});

self.addEventListener("activate", (e) => {
  console.log("Service Worker: Activate");
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== cacheName) {
            console.log("Service Worker: Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});
