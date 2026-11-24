import { HttpError } from './http-error.js';

const SLASH = 47;

export function trimSlashes(value) {
  let start = 0;
  let end = value.length;
  while (start < end && value.charCodeAt(start) === SLASH) start += 1;
  while (end > start && value.charCodeAt(end - 1) === SLASH) end -= 1;
  return value.slice(start, end);
}

function collectQuery(searchParams) {
  const query = Object.create(null);
  for (const [key, value] of searchParams) {
    const existing = query[key];
    if (existing === undefined) query[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else query[key] = [existing, value];
  }
  return query;
}

export function parseRequestTarget(rawTarget) {
  if (typeof rawTarget !== 'string' || !rawTarget.startsWith('/')) {
    throw new HttpError(400, 'invalid_request_target');
  }
  let url;
  try {
    url = new URL(`http://localhost${rawTarget}`);
  } catch {
    throw new HttpError(400, 'invalid_request_target');
  }
  return { path: trimSlashes(url.pathname), query: collectQuery(url.searchParams) };
}
