import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ownedAvatar, validProfileName, validateNewPassword, prepareAvatar } from '../src/account-utils.js';
test('profile validation rejects empty names and another account photo',()=>{
 const id='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
 assert.equal(validProfileName('   '),false);assert.equal(validProfileName('A'.repeat(61)),false);assert.equal(validProfileName(' Adit '),true);
 assert.equal(ownedAvatar(`${id}/${other}.jpg`,id),true);assert.equal(ownedAvatar(`${other}/${id}.jpg`,id),false);assert.equal(ownedAvatar(`${id}/../file.jpg`,id),false);
});
test('password validation catches missing current, short, reused and mismatched passwords',()=>{
 assert.ok(validateNewPassword('','New-password','New-password'));
 assert.ok(validateNewPassword('Old-password','short','short'));
 assert.ok(validateNewPassword('Old-password','Old-password','Old-password'));
 assert.ok(validateNewPassword('Old-password','New-password','Different'));
 assert.equal(validateNewPassword('Old-password','New-password','New-password'),'');
});
test('photo processing rejects unsupported files and oversized photos before decoding',async()=>{
 await assert.rejects(()=>prepareAvatar({type:'image/svg+xml',size:100}));
 await assert.rejects(()=>prepareAvatar({type:'image/jpeg',size:9*1024*1024}));
});
