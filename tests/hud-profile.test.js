import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const mobileLayoutSource=readFileSync(new URL('../mobile-layout.js',import.meta.url),'utf8');

test('HUD pilote : le portrait reste contenu dans son cadre doré',()=>{
 assert.match(mobileLayoutSource,/avatar-frame medium hud-avatar/);
 assert.match(mobileLayoutSource,/width:44px!important/);
 assert.match(mobileLayoutSource,/height:44px!important/);
 assert.match(mobileLayoutSource,/border:2px solid #e6c88f!important/);
 assert.match(mobileLayoutSource,/overflow:hidden!important/);
 assert.match(mobileLayoutSource,/object-fit:cover!important/);
 assert.match(mobileLayoutSource,/object-position:center!important/);
});
