const { ErrorResponse } = require("./utils/errorResponse");

const errorHandlerMiddleware = (err, req, res, next) => {
  console.error("ERROR:", err);

  let error = { ...err };
  error.message = err.message;

  if (err instanceof ErrorResponse) {
    return res.status(err.statusCode).json({
      msg: err.message,
    });
  }

  if (err.name === "CastError") {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    msg: error.message || "An unexpected server error occurred.",
  });
};

module.exports = errorHandlerMiddleware;
