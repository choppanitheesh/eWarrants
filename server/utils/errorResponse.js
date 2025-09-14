class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

class NotFoundError extends ErrorResponse {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

class BadRequestError extends ErrorResponse {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

module.exports = { ErrorResponse, NotFoundError, BadRequestError };
