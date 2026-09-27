import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { createServer } from 'vite';

let server;
let RoomChat;

before(async () => {
  server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  ({ default: RoomChat } = await server.ssrLoadModule('/src/pages/chat/roomChat.jsx'));
});

after(async () => server?.close());

function renderRoom(initialMessages = []) {
  return renderToStaticMarkup(createElement(MemoryRouter, null,
    createElement(RoomChat, { initialMessages, recipientName: 'User' })));
}

test('an empty conversation invites the user to start chatting', () => {
  const html = renderRoom();
  assert.match(html, /Belum ada pesan/);
  assert.match(html, /Sapa User dan mulai obrolannya/);
  assert.match(html, /Ketik pesan/);
});

test('existing messages replace the empty state and share a date separator', () => {
  const html = renderRoom([
    { id: '1', text: 'Hi kak, ditunggu yaa :)', sender: 'other', createdAt: '2026-08-28T05:46:00' },
    { id: '2', text: 'Siap kak', sender: 'me', createdAt: '2026-08-28T20:25:00' },
    { id: '3', text: 'Terima kasih', sender: 'other', createdAt: '2026-08-29T09:15:00' },
  ]);
  assert.doesNotMatch(html, /Belum ada pesan/);
  assert.match(html, /Hi kak, ditunggu yaa/);
  assert.match(html, /Siap kak/);
  assert.match(html, /Terima kasih/);
  assert.equal(html.split('>28 Agustus 2026<').length - 1, 1);
  assert.equal(html.split('>29 Agustus 2026<').length - 1, 1);
  assert.match(html, /05\.46/);
  assert.match(html, /20\.25/);
});

test('message content is escaped instead of rendered as HTML', () => {
  const html = renderRoom([
    { id: '1', text: '<script>alert(1)</script>', sender: 'other', createdAt: '2026-08-28T05:46:00' },
  ]);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
