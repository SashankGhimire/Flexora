const sendError = (res, status, message, data) => {
  const payload = { message };
  if (data !== undefined) {
    payload.data = data;
  }

  return res.status(status).json(payload);
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  sendError,
  asyncHandler,
};
