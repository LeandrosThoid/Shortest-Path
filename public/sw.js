const staticCacheName = "site-staticv3";
const dynamicCacheName = "site-dynamicv3";
const assets = [
  "/public",
  "/public/index.html",
  "/public/js/app.js",
  "/public/js/ui.js",
  "/public/js/page.js",
  "/public/js/materialize.min.js",
  "/public/js/sweetalert2.min.js",
  "/public/css/styles.css",
  "/public/css/materialize.min.css",
  "/public/css/sweetalert2.min.css",
  "/public/img/logo.png",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://fonts.gstatic.com/s/materialicons/v47/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2",
  "/public/pages/fallback.html",
  "https://unpkg.com/leaflet@1.8.0/dist/leaflet.css",
  "https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css",
  "https://unpkg.com/leaflet@1.8.0/dist/leaflet.js",
  "https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js"
];

// cache size limit function
const limitCacheSize = (name, size) => {
  caches.open(name).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(limitCacheSize(name, size));
      }
    });
  });
};

// install event
self.addEventListener("install", (evt) => {
  evt.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      console.log("caching shell assets");
      return cache.addAll(assets).catch((error) => {
        console.error("Failed to cache assets:", error);
      });
    })
  );
});

// activate event
self.addEventListener("activate", (evt) => {
  //console.log('service worker activated');
  evt.waitUntil(
    caches.keys().then((keys) => {
      //console.log(keys);
      return Promise.all(
        keys
          .filter((key) => key !== staticCacheName && key !== dynamicCacheName)
          .map((key) => caches.delete(key))
      );
    })
  );
});

// fetch event
self.addEventListener("fetch", (evt) => {
  if (evt.request.url.indexOf("firestore.googleapis.com") === -1) {
    evt.respondWith(
      caches
        .match(evt.request)
        .then((cacheRes) => {
          return (
            cacheRes ||
            fetch(evt.request).then((fetchRes) => {
              return caches.open(dynamicCacheName).then((cache) => {
                cache.put(evt.request.url, fetchRes.clone());
                // check cached items size
                limitCacheSize(dynamicCacheName, 75);
                return fetchRes;
              });
            })
          );
        })
        .catch(() => {
          if (evt.request.url.indexOf(".html") > -1) {
            return caches.match("/public/pages/fallback.html");
          }
        })
    );
  }
});
