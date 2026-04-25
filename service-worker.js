// Service Worker: 最低限のオフライン対応
// バージョンを変更するとキャッシュが更新されます
const CACHE_VERSION = 'nutrition-calc-v2';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './data/iv-master.json',
  './data/meal-master.json',
  './data/enteral-master.json',
  './data/ons-master.json'
];

self.addEventListener('install', (event) => {
  // インストール時に必要ファイルをキャッシュに入れる
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // 失敗しても全体が落ちないよう個別に追加
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch(() => {
            // キャッシュ失敗は致命的でないので無視
            return null;
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // 古いキャッシュを削除
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // GET 以外はキャッシュしない
  if (req.method !== 'GET') {
    return;
  }
  // ネットワーク優先、失敗時はキャッシュから
  event.respondWith(
    fetch(req)
      .then((res) => {
        // 成功したらキャッシュも更新
        const clone = res.clone();
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(req, clone).catch(() => {
            // 失敗は無視
          });
        });
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) => hit || new Response('', { status: 504 }))
      )
  );
});
