import assert from 'node:assert/strict';
import test from 'node:test';
import * as gigs from '../src/lib/api.js';

test('creating a gig sends the session and a fresh CSRF token with multipart data', async (t) => {
  const form = new FormData();
  form.set('title', 'Poster kegiatan kampus');
  form.set('photos', new Blob(['image'], { type: 'image/png' }), 'poster.png');
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url, options });
    return Response.json(url.endsWith('csrf-token')
      ? { csrf_token: 'fresh-token' }
      : { success: true }, { status: url.endsWith('csrf-token') ? 200 : 201 });
  });

  assert.equal(typeof gigs.createGig, 'function');
  await gigs.createGig(form);
  assert.equal(requests[0].url, '/api/auth/csrf-token');
  assert.equal(requests[0].options.credentials, 'include');
  assert.equal(requests[1].url, '/api/gigs');
  assert.equal(requests[1].options.method, 'POST');
  assert.equal(requests[1].options.credentials, 'include');
  assert.equal(requests[1].options.headers['X-CSRF-TOKEN'], 'fresh-token');
  assert.equal(requests[1].options.headers['Content-Type'], undefined);
  assert.equal(requests[1].options.body, form);
});

test('an expired login gives a useful message instead of Unauthenticated', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => Response.json(
    url.endsWith('csrf-token') ? { csrf_token: 'token' } : { message: 'Unauthenticated.' },
    { status: url.endsWith('csrf-token') ? 200 : 401 },
  ));
  assert.equal(typeof gigs.createGig, 'function');
  await assert.rejects(gigs.createGig(new FormData()), /Sesi login.*Silakan login kembali/);
});

test('gig validation failures keep the server message', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => Response.json(
    url.endsWith('csrf-token') ? { csrf_token: 'token' } : { message: 'Budget wajib diisi.' },
    { status: url.endsWith('csrf-token') ? 200 : 422 },
  ));
  assert.equal(typeof gigs.createGig, 'function');
  await assert.rejects(gigs.createGig(new FormData()), /Budget wajib diisi/);
});
