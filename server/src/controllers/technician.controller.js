const technicianService = require('../services/technician.service');
const reviewService = require('../services/review.service');
const apiResponse = require('../utils/apiResponse');

async function getProfile(req, res, next) {
  try {
    const profile = await technicianService.getProfile(req.user.id);
    return apiResponse.success(res, profile, 'Technician profile retrieved');
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const profile = await technicianService.getById(parseInt(req.params.id, 10));
    return apiResponse.success(res, profile, 'Technician details retrieved');
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const profile = await technicianService.updateProfile(req.user.id, req.body);
    return apiResponse.success(res, profile, 'Technician profile updated');
  } catch (err) {
    next(err);
  }
}

async function setAvailability(req, res, next) {
  try {
    const { is_available, is_online } = req.body;
    const profile = await technicianService.setAvailability(req.user.id, is_available, is_online);
    return apiResponse.success(res, profile, 'Availability updated');
  } catch (err) {
    next(err);
  }
}

async function findNearby(req, res, next) {
  try {
    const { latitude, longitude, radius, category_id, available_only } = req.query;
    const technicians = await technicianService.findNearby({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      radiusKm: radius ? parseFloat(radius) : 10,
      categoryId: category_id ? parseInt(category_id, 10) : null,
      onlyAvailable: available_only !== 'false'
    });
    return apiResponse.success(res, technicians, 'Nearby technicians found');
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    const { status, notes } = req.body;
    const profile = await technicianService.verify(
      parseInt(req.params.id, 10),
      status,
      req.user.id,
      notes
    );
    return apiResponse.success(res, profile, 'Technician verification status updated');
  } catch (err) {
    next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const { page, limit, status, city, search } = req.query;
    const result = await technicianService.getAll({
      page: parseInt(page || '1', 10),
      limit: parseInt(limit || '20', 10),
      status,
      city,
      search
    });
    return apiResponse.paginated(
      res,
      result.technicians,
      { page, limit, total: result.total },
      'Technicians retrieved'
    );
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await technicianService.getStats(req.user.id);
    return apiResponse.success(res, stats, 'Technician stats retrieved');
  } catch (err) {
    next(err);
  }
}

async function updateSkills(req, res, next) {
  try {
    const { skills } = req.body;
    const updatedSkills = await technicianService.updateSkills(req.user.id, skills);
    return apiResponse.success(res, updatedSkills, 'Technician skills updated');
  } catch (err) {
    next(err);
  }
}

async function getTechnicianReviews(req, res, next) {
  try {
    const { page, limit } = req.query;
    const technicianId = parseInt(req.params.id, 10);
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

async function getSkills(req, res, next) {
  try {
    const technicianId = parseInt(req.params.id, 10);
    const skills = await technicianService.getSkillsByTechnicianId(technicianId);
    return apiResponse.success(res, skills, 'Technician skills retrieved');
  } catch (err) {
    next(err);
  }
}

async function updateLocation(req, res, next) {
  try {
    const { latitude, longitude } = req.body;
    await technicianService.updateProfile(req.user.id, { latitude, longitude });
    return apiResponse.success(res, { latitude, longitude }, 'Location updated successfully');
  } catch (err) {
    next(err);
  }
}

async function uploadDocument(req, res, next) {
  try {
    const result = await technicianService.uploadDocument(req.user.id, req.body);
    return apiResponse.success(res, result, 'Document submitted for verification', 201);
  } catch (err) {
    next(err);
  }
}

async function getDocuments(req, res, next) {
  try {
    const documents = await technicianService.getDocuments(req.user.id);
    return apiResponse.success(res, documents, 'Technician documents retrieved');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  getById,
  updateProfile,
  setAvailability,
  findNearby,
  verify,
  getAll,
  getStats,
  updateSkills,
  getTechnicianReviews,
  getSkills,
  updateLocation,
  uploadDocument,
  getDocuments
};
