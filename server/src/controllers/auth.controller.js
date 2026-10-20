const authService = require('../services/auth.service');
const apiResponse = require('../utils/apiResponse');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return apiResponse.success(res, result, 'Registration successful', 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return apiResponse.success(res, result, 'Login successful', 200);
  } catch (err) {
    next(err);
  }
}

async function googleLogin(req, res, next) {
  try {
    const { credential, role } = req.body;
    const result = await authService.googleLogin(credential, role);
    return apiResponse.success(res, result, 'Google authentication successful', 200);
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    return apiResponse.success(res, user, 'Profile retrieved successfully', 200);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    return apiResponse.success(res, user, 'Profile updated successfully', 200);
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password, currentPassword, newPassword } = req.body;
    const cur = current_password || currentPassword;
    const nw = new_password || newPassword;
    await authService.changePassword(req.user.id, cur, nw);
    return apiResponse.success(res, null, 'Password changed successfully', 200);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    // Client-side JWT invalidation (token removal)
    return apiResponse.success(res, null, 'Logged out successfully', 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  googleLogin,
  getMe,
  updateProfile,
  changePassword,
  logout
};
