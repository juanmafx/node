import { HttpError } from './http-error.js';

function decodeUtf8(chunks) {
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(Buffer.concat(chunks));
  } catch {
    throw new HttpError(400, 'invalid_utf8_body');
  }
}

export function readBody(request, maxBytes) {
  const declaredLength = Number(request.headers['content-length'] ?? 0);
  if (declaredLength > maxBytes) {
    return Promise.reject(new HttpError(413, 'payload_too_large'));
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    let receivedBytes = 0;

    const detach = () => {
      request.off('data', onData);
      request.off('end', onEnd);
      request.off('error', onAbort);
      request.off('close', onAbort);
    };
    const onData = (chunk) => {
      receivedBytes += chunk.length;
      if (receivedBytes > maxBytes) {
        detach();
        request.pause();
        reject(new HttpError(413, 'payload_too_large'));
        return;
      }
      chunks.push(chunk);
    };
    const onEnd = () => {
      detach();
      try {
        resolve(decodeUtf8(chunks));
      } catch (error) {
        reject(error);
      }
    };
    const onAbort = () => {
      detach();
      reject(new HttpError(400, 'request_aborted'));
    };

    request.on('data', onData);
    request.once('end', onEnd);
    request.once('error', onAbort);
    request.once('close', onAbort);
  });
}
