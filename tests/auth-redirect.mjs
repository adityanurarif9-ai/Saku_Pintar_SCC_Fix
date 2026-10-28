import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTION_APP_URL, resolveAuthRedirect, confirmationError } from '../src/auth-urls.js';
import { parseRuntimeStatus, requiresMaintenance, OPEN_STATUS } from '../src/runtime-utils.js';
test('confirmation emails default to production even when signup is opened on localhost or a preview', () => {
  assert.equal(resolveAuthRedirect({origin:'http://localhost:5176'}),PRODUCTION_APP_URL);
  assert.equal(resolveAuthRedirect({origin:'https://preview.example.test'}),PRODUCTION_APP_URL);
  for (const appUrl of ['', 'bad', 'http://localhost:3000', 'https://localhost:3000', 'https://user:password@example.test/']) assert.equal(resolveAuthRedirect({appUrl}),PRODUCTION_APP_URL);
  assert.equal(resolveAuthRedirect({appUrl:'https://app.example.test/somewhere?secret=test#fragment'}),'https://app.example.test/');
});
test('local confirmation requires explicit local-testing opt in and a loopback origin', () => {
  assert.equal(resolveAuthRedirect({origin:'http://127.0.0.1:5176',allowLocal:true}),'http://127.0.0.1:5176/');
  assert.equal(resolveAuthRedirect({origin:'http://[::1]:5176',allowLocal:true}),'http://[::1]:5176/');
  assert.equal(resolveAuthRedirect({origin:'https://outside.example.test',allowLocal:true}),PRODUCTION_APP_URL);
});
test('expired callback produces a helpful message without exposing raw URL error contents', () => {
  assert.match(confirmationError('https://example.test/#error=access_denied&error_code=otp_expired'),/kedaluwarsa/);
  assert.equal(confirmationError('https://example.test/'),'');
  assert.doesNotMatch(confirmationError('https://example.test/?error=PRIVATE&error_description=PRIVATE'),/PRIVATE/);
});
test('maintenance blocks visitors and regular users; only a verified admin profile bypasses', () => {
  assert.equal(requiresMaintenance(OPEN_STATUS,null),false);
  assert.equal(requiresMaintenance({maintenance:true},null),true);
  assert.equal(requiresMaintenance({maintenance:true},{role:'user'}),true);
  assert.equal(requiresMaintenance({maintenance:true},{role:'admin'}),false);
  assert.throws(()=>parseRuntimeStatus({maintenance:'false',message:'hello'}));
  assert.throws(()=>parseRuntimeStatus({maintenance:true,message:' '.repeat(3)}));
  const parsed=parseRuntimeStatus({maintenance:true,message:'Update',private_key:'must be omitted'});
  assert.deepEqual(parsed,{maintenance:true,message:'Update',updated_at:null});
});
