/**
 * asyncWrapper - utility to wrap async route handlers and forward errors to next().
 */
export default fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
