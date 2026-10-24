const adminService = require('../services/admin.service');
const userRepo = require('../repositories/user.repository');
const technicianRepo = require('../repositories/technician.repository');
const technicianService = require('../services/technician.service');
const bookingService = require('../services/booking.service');
const assignmentService = require('../services/assignment.service');
const claimService = require('../services/claim.service');
const reviewService = require('../services/review.service');
const { pool } = require('../config/database');
const apiResponse = require('../utils/apiResponse');
const AppError = require('../utils/apiError');

async function getDashboard(req, res, next) {
  try {
    const stats = await adminService.getDashboardStats();
    return apiResponse.success(res, stats, 'Dashboard statistics retrieved');
  } catch (err) {
    next(err);
  }
}

async function getUsers(req, res, next) {
  try {
    const { page, limit, role, search, is_active } = req.query;
    const result = await userRepo.findAll({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      role,
      search,
      isActive: is_active !== undefined ? is_active === 'true' || is_active === '1' : null
    });
    return apiResponse.paginated(
      res,
      result.users,
      { page, limit, total: result.total },
      'Users list retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { is_active } = req.body;
    await userRepo.update(userId, { is_active: is_active ? 1 : 0 });
    const updatedUser = await userRepo.findById(userId);
    return apiResponse.success(res, updatedUser, 'User status updated');
  } catch (err) {
    next(err);
  }
}

async function getBookings(req, res, next) {
  try {
    const { page, limit, status, category_id, is_emergency, start_date, end_date, search } = req.query;
    const result = await adminService.getBookingReport({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      status,
      categoryId: category_id ? parseInt(category_id, 10) : null,
      isEmergency: is_emergency !== undefined ? is_emergency === 'true' || is_emergency === '1' : null,
      startDate: start_date,
      endDate: end_date,
      search
    });
    return apiResponse.paginated(
      res,
      result.bookings,
      { page, limit, total: result.total },
      'Bookings retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function getPayments(req, res, next) {
  try {
    const { page, limit, status, payment_method, start_date, end_date } = req.query;
    const result = await adminService.getPaymentReport({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      status,
      paymentMethod: payment_method,
      startDate: start_date,
      endDate: end_date
    });
    return apiResponse.paginated(
      res,
      result.payments,
      { page, limit, total: result.total },
      'Payments retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function getSettings(req, res, next) {
  try {
    const settings = await adminService.getSettings();
    return apiResponse.success(res, settings, 'Platform settings retrieved');
  } catch (err) {
    next(err);
  }
}

async function updateSetting(req, res, next) {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const updated = await adminService.updateSetting(key, value, req.user.id);
    return apiResponse.success(res, updated, `Setting '${key}' updated successfully`);
  } catch (err) {
    next(err);
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const { page, limit, action, entity_type, actor_id, start_date, end_date } = req.query;
    const result = await adminService.getAuditLogs({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '25', 10),
      action,
      entityType: entity_type,
      actorId: actor_id ? parseInt(actor_id, 10) : null,
      startDate: start_date,
      endDate: end_date
    });
    return apiResponse.paginated(
      res,
      result.logs,
      { page, limit, total: result.total },
      'Audit logs retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function reassignBooking(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const { technician_id } = req.body;

    if (technician_id) {
      await bookingService.assignTechnician(bookingId, parseInt(technician_id, 10), req.user.id);
    } else {
      await assignmentService.assignNextTechnician(bookingId);
    }

    const updatedBooking = await bookingService.getById(bookingId, req.user);
    return apiResponse.success(res, updatedBooking, 'Booking reassignment triggered');
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await userRepo.findById(parseInt(req.params.id, 10));
    if (!user) throw AppError.notFound('User not found');
    return apiResponse.success(res, user, 'User retrieved');
  } catch (err) {
    next(err);
  }
}

async function getEmergencyBookings(req, res, next) {
  try {
    const { page, limit, status, search } = req.query;
    const result = await adminService.getBookingReport({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      status,
      isEmergency: true,
      search
    });
    return apiResponse.paginated(
      res,
      result.bookings,
      { page, limit, total: result.total },
      'Emergency bookings retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function getTechniciansForVerification(req, res, next) {
  try {
    const { page, limit, status, verification_status, search } = req.query;
    const filterStatus = verification_status || status;

    const result = await technicianRepo.findAll({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      status: (!filterStatus || filterStatus === 'all') ? null : filterStatus,
      search
    });

    if (result.technicians && result.technicians.length > 0) {
      const techIds = result.technicians.map(t => t.id);

      // 1. Fetch submitted documents for each technician
      const [docs] = await pool.query(
        `SELECT td.*, u.first_name AS reviewer_first_name, u.last_name AS reviewer_last_name
         FROM technician_documents td
         LEFT JOIN users u ON u.id = td.reviewed_by
         WHERE td.technician_id IN (${techIds.map(() => '?').join(',')})
         ORDER BY td.created_at DESC`,
        techIds
      );

      // 2. Fetch skills for each technician
      const [skills] = await pool.query(
        `SELECT ts.technician_id, sc.name AS category_name, sc.slug AS category_slug, sc.icon, ts.years_experience
         FROM technician_skills ts
         JOIN service_categories sc ON sc.id = ts.category_id
         WHERE ts.technician_id IN (${techIds.map(() => '?').join(',')})
         ORDER BY sc.name ASC`,
        techIds
      );

      const docsByTech = {};
      docs.forEach(d => {
        if (!docsByTech[d.technician_id]) docsByTech[d.technician_id] = [];
        docsByTech[d.technician_id].push(d);
      });

      const skillsByTech = {};
      skills.forEach(s => {
        if (!skillsByTech[s.technician_id]) skillsByTech[s.technician_id] = [];
        skillsByTech[s.technician_id].push(s);
      });

      result.technicians.forEach(t => {
        t.documents = docsByTech[t.id] || [];
        t.skills = skillsByTech[t.id] || [];
        t.pending_documents_count = (docsByTech[t.id] || []).filter(d => d.status === 'PENDING').length;
      });
    }

    return apiResponse.paginated(
      res,
      result.technicians,
      { page: parseInt(page || '1', 10), limit: parseInt(limit || '20', 10), total: result.total },
      'Technicians for verification retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function reviewDocument(req, res, next) {
  try {
    const documentId = parseInt(req.params.id, 10);
    const { status, notes } = req.body;
    const result = await technicianService.reviewDocument(documentId, status, req.user.id, notes);
    return apiResponse.success(res, result, `Document verification updated to ${status}`);
  } catch (err) {
    next(err);
  }
}

async function getClaims(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const result = await claimService.getAll({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      status
    });
    return apiResponse.paginated(
      res,
      result.claims,
      { page, limit, total: result.total },
      'Warranty claims retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function getReviews(req, res, next) {
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
      'Reviews retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function toggleReviewVisibility(req, res, next) {
  try {
    const reviewId = parseInt(req.params.id, 10);
    const { is_visible } = req.body;
    await pool.query('UPDATE reviews SET is_visible = ? WHERE id = ?', [is_visible ? 1 : 0, reviewId]);
    return apiResponse.success(res, { id: reviewId, is_visible: !!is_visible }, 'Review visibility updated');
  } catch (err) {
    next(err);
  }
}

async function deleteReview(req, res, next) {
  try {
    const reviewId = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
    return apiResponse.success(res, { id: reviewId }, 'Review deleted');
  } catch (err) {
    next(err);
  }
}

async function getSettlements(req, res, next) {
  try {
    const earningsService = require('../services/earnings.service');
    const { page, limit, status, search } = req.query;
    const result = await earningsService.getAll({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      settlementStatus: status,
      search
    });
    return apiResponse.success(
      res,
      {
        settlements: result.earnings,
        summary: result.summary,
        total: result.total,
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '20', 10)
      },
      'Settlements retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
}

async function settlePayout(req, res, next) {
  try {
    const earningsService = require('../services/earnings.service');
    const earningId = parseInt(req.params.id, 10);
    const { notes } = req.body;
    const updated = await earningsService.settle(earningId, req.user.id, notes);
    return apiResponse.success(res, updated, 'Technician payout successfully verified and settled');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  getUsers,
  getUserById,
  updateUserStatus,
  getBookings,
  getEmergencyBookings,
  getPayments,
  getSettlements,
  settlePayout,
  getSettings,
  updateSetting,
  getAuditLogs,
  reassignBooking,
  getTechniciansForVerification,
  reviewDocument,
  getClaims,
  getReviews,
  toggleReviewVisibility,
  deleteReview
};
