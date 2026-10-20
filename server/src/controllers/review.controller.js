const reviewService = require('../services/review.service');
const { pool } = require('../config/database');
const apiResponse = require('../utils/apiResponse');

async function create(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id || req.body.booking_id, 10);
    const review = await reviewService.create(bookingId, req.user.id, req.body);
    return apiResponse.success(res, review, 'Review submitted successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function getTechnicianReviews(req, res, next) {
  try {
    const technicianId = parseInt(req.params.id, 10);
    const { page, limit } = req.query;
    const result = await reviewService.getByTechnician(technicianId, {
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '10', 10)
    });
    return apiResponse.paginated(
      res,
      result.reviews,
      { page, limit, total: result.total },
      'Technician reviews retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function getMyReviews(req, res, next) {
  try {
    const { page, limit } = req.query;
    if (req.user.role === 'customer') {
      const result = await reviewService.getByCustomer(req.user.id, {
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '10', 10)
      });
      return apiResponse.paginated(
        res,
        result.reviews,
        { page, limit, total: result.total },
        'My reviews retrieved'
      );
    } else {
      const result = await reviewService.getByTechnician(req.user.id, {
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '10', 10)
      });
      return apiResponse.paginated(
        res,
        result.reviews,
        { page, limit, total: result.total },
        'Reviews for me retrieved'
      );
    }
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const reviewId = parseInt(req.params.id, 10);
    const { rating, comment, title } = req.body;
    await pool.query(
      `UPDATE reviews SET rating = COALESCE(?, rating), comment = COALESCE(?, comment), title = COALESCE(?, title)
       WHERE id = ? AND customer_id = ?`,
      [rating, comment, title, reviewId, req.user.id]
    );
    const [rows] = await pool.query('SELECT * FROM reviews WHERE id = ?', [reviewId]);
    return apiResponse.success(res, rows[0], 'Review updated successfully');
  } catch (err) {
    next(err);
  }
}

async function deleteReview(req, res, next) {
  try {
    const reviewId = parseInt(req.params.id, 10);
    if (req.user.role === 'admin') {
      await pool.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
    } else {
      await pool.query('DELETE FROM reviews WHERE id = ? AND customer_id = ?', [reviewId, req.user.id]);
    }
    return apiResponse.success(res, { id: reviewId }, 'Review deleted');
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const { page, limit, rating, is_visible } = req.query;
    const result = await reviewService.getAll({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      rating: rating ? parseInt(rating, 10) : null,
      isVisible: is_visible !== undefined ? is_visible === 'true' || is_visible === '1' : null
    });
    return apiResponse.paginated(
      res,
      result.reviews,
      { page, limit, total: result.total },
      'All reviews retrieved'
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  getTechnicianReviews,
  getMyReviews,
  update,
  deleteReview,
  getAll
};
