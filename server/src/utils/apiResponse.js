/**
 * Standard API Response utilities
 */

/**
 * Send a success response
 * @param {import('express').Response} res
 * @param {*} data
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 */
function success(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Send an error response
 * @param {import('express').Response} res
 * @param {string} [message='An error occurred']
 * @param {number} [statusCode=500]
 * @param {Array|Object|null} [errors=null]
 */
function error(res, message = 'An error occurred', statusCode = 500, errors = null) {
  const response = {
    success: false,
    message,
    data: null
  };

  if (errors !== null && errors !== undefined) {
    response.errors = Array.isArray(errors) ? errors : [errors];
  }

  return res.status(statusCode).json(response);
}

/**
 * Send a paginated success response
 * @param {import('express').Response} res
 * @param {Array} data
 * @param {{ page: number, limit: number, total: number, totalPages?: number }} pagination
 * @param {string} [message='Success']
 * @param {number} [statusCode=200]
 */
function paginated(res, data = [], pagination = {}, message = 'Success', statusCode = 200) {
  const page = parseInt(pagination.page || 1, 10);
  const limit = parseInt(pagination.limit || 10, 10);
  const total = parseInt(pagination.total || 0, 10);
  const totalPages = pagination.totalPages !== undefined 
    ? pagination.totalPages 
    : Math.ceil(total / (limit > 0 ? limit : 1));

  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
}

module.exports = {
  success,
  error,
  paginated
};
