export default (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    data: null,
  });
};
