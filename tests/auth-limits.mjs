import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authMessage, rateLimited, startEmailPause, readEmailPause } from '../src/auth-errors.js';
import { installPlatform } from '../src/install-platform.js';
test('email quota, request flood and sender restriction have different recovery instructions',()=>{
 assert.match(authMessage({code:'over_email_send_rate_limit'}),/pengiriman email/);
 assert.match(authMessage({code:'over_request_rate_limit'}),/terlalu sering/);
 assert.match(authMessage({code:'email_address_not_authorized'}),/Pengelola/);
 assert.equal(rateLimited({status:429}),true);assert.equal(rateLimited({code:'invalid_credentials'}),false);
});
test('email pause survives a reload without storing account data and tolerates blocked browser storage',()=>{
 const saved=new Map();const store={getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)};
 assert.equal(startEmailPause(store,100000),160000);assert.equal(readEmailPause(store,110000),160000);
 assert.equal(readEmailPause(store,160000),0);assert.equal(readEmailPause(store,1),0);
 assert.equal(readEmailPause({getItem(){throw Error('private mode');}},100000),0);
 assert.equal(startEmailPause({setItem(){throw Error('quota');}},100000),160000);
});
test('installation guide distinguishes iPhone, desktop-mode iPad and Android',()=>{
 assert.equal(installPlatform({userAgent:'Mozilla iPhone AppleWebKit Safari'}),'ios');
 assert.equal(installPlatform({userAgent:'Macintosh Safari',platform:'MacIntel',maxTouchPoints:5}),'ios');
 assert.equal(installPlatform({userAgent:'Android Chrome'}),'android');
 assert.equal(installPlatform({userAgent:'Windows Chrome'}),'other');
});
