import NodeCache from 'node-cache';
import logger from '../config/logger.js';

// Standard cache duration: 5 minutes
const stdCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Middleware to cache HTTP responses.
 * Usage: router.get('/endpoint', cacheMiddleware(300), controller.handler)
 * 
 * @param {number} duration Cache duration in seconds
 */
export const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Construct cache key from URL and query params
    const key = `__express__${req.originalUrl || req.url}`;
    const cachedBody = stdCache.get(key);

    if (cachedBody) {
      logger.debug(`Cache hit for ${key}`);
      return res.status(200).json(cachedBody);
    }

    logger.debug(`Cache miss for ${key}`);

    // Override res.json to intercept the response and cache it
    const originalJson = res.json;
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        stdCache.set(key, body, duration);
      }
      return originalJson.call(res, body);
    };

    next();
  };
};

/**
 * Clear specific cache key.
 * @param {string} key 
 */
export const clearCache = (key) => {
  stdCache.del(key);
};

export default { cacheMiddleware, clearCache };
