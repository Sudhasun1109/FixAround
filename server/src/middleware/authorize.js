const AppError = require('../utils/apiError');

/**
 * Middleware factory for role-based authorization
 * @param  {...string} roles Allowed roles (e.g. 'admin', 'technician', 'customer')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('User must be authenticated to access this resource'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access forbidden: requires one of the following roles: [${roles.join(', ')}]. Current role: '${req.user.role}'`
        )
      );
    }

    next();
  };
}

module.exports = authorize;
