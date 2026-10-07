import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/tracker.js';
function response(){return {statusCode:200,headers:{},status(n){this.statusCode=n;return this;},setHeader(k,v){this.headers[k]=v;},json(body){this.body=body;return this;}};}
test('unconfigured storage returns an explicitly labelled verified snapshot',async()=>{const res=response();await handler({method:'GET'},res);assert.equal(res.statusCode,200);assert.equal(res.body.mode,'snapshot');assert.equal(res.body.days.length,28);assert.equal(res.body.releases.length,5);assert.equal(res.headers['Cache-Control'],'no-store');});
test('public API does not accept writes',async()=>{const res=response();await handler({method:'POST'},res);assert.equal(res.statusCode,405);assert.equal(res.body.error,'Method not allowed');});
