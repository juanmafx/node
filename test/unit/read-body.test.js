import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { describe, it } from 'node:test';
import { readBody } from '../../src/http/read-body.js';

function createRequest(headers = {}) {
  const stream = new PassThrough();
  stream.headers = headers;
  return stream;
}

const hasStatus = (statusCode) => (error) => error.statusCode === statusCode;

describe('readBody', () => {
  it('reassembles a multibyte character split across chunks', async () => {
    const request = createRequest();
    const bytes = Buffer.from('café');
    const pending = readBody(request, 64);
    request.write(bytes.subarray(0, 4));
    request.end(bytes.subarray(4));
    assert.equal(await pending, 'café');
  });

  it('rejects an oversized declared length before reading', async () => {
    await assert.rejects(readBody(createRequest({ 'content-length': '65' }), 64), hasStatus(413));
  });

  it('rejects an oversized stream without a declared length', async () => {
    const request = createRequest();
    const pending = readBody(request, 4);
    request.write(Buffer.alloc(5));
    await assert.rejects(pending, hasStatus(413));
  });

  it('accepts a body exactly at the limit', async () => {
    const request = createRequest();
    const pending = readBody(request, 4);
    request.end('abcd');
    assert.equal(await pending, 'abcd');
  });

  it('rejects invalid UTF-8', async () => {
    const request = createRequest();
    const pending = readBody(request, 64);
    request.end(Buffer.from([0xc3, 0x28]));
    await assert.rejects(pending, hasStatus(400));
  });

  it('rejects a stream closed before completion', async () => {
    const request = createRequest();
    const pending = readBody(request, 64);
    request.write('partial');
    request.destroy();
    await assert.rejects(pending, hasStatus(400));
  });
});
