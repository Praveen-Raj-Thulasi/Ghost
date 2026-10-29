// src/helpers/responseFormatter.js

/**
 * Standardize API JSON responses.
 * @param {boolean} success
 * @param {any} data - payload
 * @param {object} meta - optional meta info (pagination, job etc.)
 */
export function formatResponse(success, data = null, meta = {}) {
  return {
    success,
    data,
    meta,
  };
}
