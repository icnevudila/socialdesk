import test from 'node:test';
import assert from 'node:assert/strict';
import { getAdminPassword, computeAuthToken, isAuthenticated } from '../auth.mjs';

test('Şifre ve yetkilendirme sözleşmesi', async () => {
  const pw = getAdminPassword();
  assert.ok(pw.length >= 6, 'Şifre yeterince uzun olmalı');

  const token = computeAuthToken(pw);
  assert.equal(typeof token, 'string');
  assert.equal(token.length, 64, 'SHA-256 hash 64 karakter olmalı');

  // Yanlış şifre hash'i eşleşmemeli
  const wrongToken = computeAuthToken('yanlisSifre123');
  assert.notEqual(token, wrongToken);

  // Başlık üzerinden doğrulama
  const reqWithHeader = { headers: { 'x-socialdesk-auth': token } };
  assert.equal(isAuthenticated(reqWithHeader), true);

  // Cookie üzerinden doğrulama
  const reqWithCookie = { headers: { cookie: `other=1; socialdesk_auth=${token}; more=2` } };
  assert.equal(isAuthenticated(reqWithCookie), true);
});
