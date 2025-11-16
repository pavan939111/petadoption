import User from '../models/User.js';
import Pet from '../models/Pet.js';
import Notification from '../models/Notification.js';

/**
 * Admin Dashboard - Get statistics and analytics
 * Only accessible to admin users
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalRescuers = await User.countDocuments({ role: 'rescuer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // Get total pets count
    const totalPets = await Pet.countDocuments();
    const foundPets = await Pet.countDocuments({ type: 'found' });
    const lostPets = await Pet.countDocuments({ type: 'lost' });
    const adoptablePets = await Pet.countDocuments({ type: 'adoption' });

    // Get recent users (last 10)
    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent pets (last 10)
    const recentPets = await Pet.find()
      .select('name type breed location status createdAt owner_id')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers + totalRescuers + totalAdmins,
          regular: totalUsers,
          rescuers: totalRescuers,
          admins: totalAdmins,
        },
        pets: {
          total: totalPets,
          found: foundPets,
          lost: lostPets,
          adoptable: adoptablePets,
        },
        recentUsers,
        recentPets,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Get all users with filtering
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, is_active } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (is_active !== undefined) filter.is_active = is_active === 'true';

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Get all pets with filtering
 */
export const getAllPets = async (req, res, next) => {
  try {
    const { type, report_type, status, location } = req.query;
    const filter = {};

    // Support both 'type' (legacy) and 'report_type' (new)
    if (type) filter.report_type = type; // 'found', 'lost'
    if (report_type) filter.report_type = report_type; // 'found', 'lost'
    if (status) filter.status = status;
    if (location) filter['last_seen_or_found_location_text'] = new RegExp(location, 'i');

    const pets = await Pet.find(filter)
      .populate('submitted_by', 'name email phone contact_preference is_verified')
      .sort({ date_submitted: -1 });

    res.status(200).json({
      success: true,
      count: pets.length,
      data: pets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Update user status or role
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active, role } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (is_active !== undefined) user.is_active = is_active;
    if (role && role !== 'admin') user.role = role; // Prevent changing to admin via this route

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Delete or deactivate a user
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin accounts',
      });
    }

    // Soft delete - deactivate instead of removing
    user.is_active = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Delete or mark pet as resolved
 */
export const deletePet = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'delete' or 'resolve'

    const pet = await Pet.findById(id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    if (action === 'resolve') {
      pet.status = 'resolved';
      await pet.save();
      return res.status(200).json({
        success: true,
        message: 'Pet marked as resolved',
        data: pet,
      });
    }

    // Hard delete
    await Pet.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Pet deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Get all pending pet reports (not verified)
 */
export const getPendingReports = async (req, res, next) => {
  try {
    const { report_type } = req.query; // 'lost', 'found', or both
    const filter = { status: 'Pending Verification' };

    if (report_type && ['lost', 'found'].includes(report_type)) {
      filter.report_type = report_type;
    }

    const pendingReports = await Pet.find(filter)
      .populate('submitted_by', 'name email phone contact_preference is_verified')
      .sort({ date_submitted: -1 });

    res.status(200).json({
      success: true,
      count: pendingReports.length,
      data: pendingReports,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Get all pending adoption requests
 */
export const getPendingAdoptionRequests = async (req, res, next) => {
  try {
    const filter = { status: 'Pending Adoption' };

    const pendingAdoptions = await Pet.find(filter)
      .populate('submitted_by', 'name email phone contact_preference is_verified')
      .sort({ date_submitted: -1 });

    res.status(200).json({
      success: true,
      count: pendingAdoptions.length,
      data: pendingAdoptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Accept and verify a pet report (Lost/Found)
 * Verification parameters are checked before acceptance
 */
export const acceptReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      notes,
      verification_params = {}
    } = req.body;

    const {
      verified_photos = false,
      verified_location = false,
      verified_contact = false,
      verified_identity = false,
      additional_notes = ''
    } = verification_params;

    const pet = await Pet.findById(id).populate('submitted_by', 'name email phone is_verified');

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet report not found',
      });
    }

    if (pet.status !== 'Pending Verification') {
      return res.status(400).json({
        success: false,
        message: `Report status is ${pet.status}, cannot verify again`,
      });
    }

    // Verification checks - Admin must verify at least some parameters
    const verificationChecks = {
      photos: verified_photos || pet.photos?.length > 0,
      location: verified_location || (pet.last_seen_or_found_location_text && pet.last_seen_or_found_coords),
      contact: verified_contact || (pet.submitted_by?.phone || pet.submitted_by?.email),
      identity: verified_identity || pet.submitted_by?.is_verified,
    };

    // Count verified parameters
    const verifiedCount = Object.values(verificationChecks).filter(Boolean).length;
    
    if (verifiedCount < 2) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient verification. At least 2 parameters must be verified (photos, location, contact, identity)',
        verification_status: verificationChecks,
      });
    }

    // Update pet status based on report type
    pet.status = pet.report_type === 'found' ? 'Listed Found' : 'Listed Lost';
    pet.verified_by = req.user.id;
    pet.verification_date = new Date();
    pet.verification_notes = notes || additional_notes || `Approved by admin. Verified: ${Object.entries(verificationChecks).filter(([_, v]) => v).map(([k]) => k).join(', ')}`;

    await pet.save();

    // Create notification for the user
    if (pet.submitted_by && pet.submitted_by._id) {
      await Notification.create({
        user: pet.submitted_by._id,
        type: 'report_accepted',
        title: `Your ${pet.report_type === 'found' ? 'Found' : 'Lost'} Pet Report Has Been Accepted!`,
        message: `Great news! Your ${pet.report_type === 'found' ? 'found' : 'lost'} pet report for ${pet.breed || pet.species} has been verified and is now listed. ${notes ? `Admin notes: ${notes}` : ''}`,
        related_pet: pet._id,
        metadata: {
          report_type: pet.report_type,
          status: pet.status,
          verification_notes: pet.verification_notes,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Report accepted and listed as ${pet.status}`,
      data: pet,
      verification_status: verificationChecks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Accept adoption request
 * Verifies adopter before approving adoption
 */
export const acceptAdoptionRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      notes,
      verification_params = {}
    } = req.body;

    const {
      verified_adopter_identity = false,
      verified_home_check = false,
      verified_references = false,
      verified_financial_stability = false,
      adopter_id = null,
      additional_notes = ''
    } = verification_params;

    const pet = await Pet.findById(id).populate('submitted_by', 'name email phone');

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found',
      });
    }

    // Check if pet is available for adoption
    if (!['Available for Adoption', 'Pending Adoption'].includes(pet.status)) {
      return res.status(400).json({
        success: false,
        message: `Pet status is ${pet.status}, cannot approve adoption`,
      });
    }

    // Verification checks for adoption - More strict requirements
    const verificationChecks = {
      adopter_identity: verified_adopter_identity,
      home_check: verified_home_check,
      references: verified_references,
      financial_stability: verified_financial_stability,
    };

    // Count verified parameters
    const verifiedCount = Object.values(verificationChecks).filter(Boolean).length;
    
    if (verifiedCount < 3) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient verification for adoption. At least 3 parameters must be verified (identity, home check, references, financial stability)',
        verification_status: verificationChecks,
      });
    }

    // Verify adopter exists if provided
    if (adopter_id) {
      const adopter = await User.findById(adopter_id);
      if (!adopter) {
        return res.status(404).json({
          success: false,
          message: 'Adopter not found',
        });
      }
      if (!adopter.is_active) {
        return res.status(400).json({
          success: false,
          message: 'Adopter account is not active',
        });
      }
    }

    // Update pet status to Adopted
    pet.status = 'Adopted';
    pet.verified_by = req.user.id;
    pet.verification_date = new Date();
    pet.verification_notes = notes || additional_notes || `Adoption approved by admin. Verified: ${Object.entries(verificationChecks).filter(([_, v]) => v).map(([k]) => k).join(', ')}`;

    // Store adopter information if provided
    if (adopter_id) {
      pet.adopted_by = adopter_id;
      pet.adoption_date = new Date();
    }

    await pet.save();

    // Create notifications for both submitter and adopter
    if (pet.submitted_by && pet.submitted_by._id) {
      await Notification.create({
        user: pet.submitted_by._id,
        type: 'adoption_accepted',
        title: 'Adoption Request Approved!',
        message: `Your adoption request for ${pet.breed || pet.species} has been approved! ${notes ? `Admin notes: ${notes}` : ''}`,
        related_pet: pet._id,
        metadata: {
          status: pet.status,
          adopter_id: adopter_id,
          verification_notes: pet.verification_notes,
        },
      });
    }

    if (adopter_id) {
      await Notification.create({
        user: adopter_id,
        type: 'adoption_accepted',
        title: 'Congratulations! Your Adoption is Approved!',
        message: `Your adoption request for ${pet.breed || pet.species} has been approved! Please contact the shelter to complete the adoption process.`,
        related_pet: pet._id,
        metadata: {
          status: pet.status,
          verification_notes: pet.verification_notes,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Adoption request approved successfully',
      data: pet,
      verification_status: verificationChecks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Reject a pet report
 */
export const rejectReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for rejection',
      });
    }

    const pet = await Pet.findById(id).populate('submitted_by', 'name email phone');

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet report not found',
      });
    }

    if (pet.status !== 'Pending Verification') {
      return res.status(400).json({
        success: false,
        message: `Report status is ${pet.status}, cannot reject`,
      });
    }

    // Mark as rejected
    pet.status = 'Rejected';
    pet.verified_by = req.user.id;
    pet.verification_date = new Date();
    pet.verification_notes = `Rejected: ${reason}`;

    await pet.save();

    // Create notification for the user
    if (pet.submitted_by && pet.submitted_by._id) {
      await Notification.create({
        user: pet.submitted_by._id,
        type: 'report_rejected',
        title: `Your ${pet.report_type === 'found' ? 'Found' : 'Lost'} Pet Report Was Not Approved`,
        message: `Unfortunately, your ${pet.report_type === 'found' ? 'found' : 'lost'} pet report for ${pet.breed || pet.species} was not approved. Reason: ${reason}`,
        related_pet: pet._id,
        metadata: {
          report_type: pet.report_type,
          status: pet.status,
          rejection_reason: reason,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Report rejected successfully',
      data: pet,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Admin: Get dashboard stats with pending counts
 */
export const getAdminDashboardStats = async (req, res, next) => {
  try {
    // Pending reports count
    const pendingLostReports = await Pet.countDocuments({
      status: 'Pending Verification',
      report_type: 'lost',
    });
    const pendingFoundReports = await Pet.countDocuments({
      status: 'Pending Verification',
      report_type: 'found',
    });

    // Verified/Active reports count
    const listedLostReports = await Pet.countDocuments({
      status: 'Listed Lost',
    });
    const listedFoundReports = await Pet.countDocuments({
      status: 'Listed Found',
    });

    // Matched reports
    const matchedReports = await Pet.countDocuments({
      status: 'Matched',
    });

    // Reunited reports
    const reunitedReports = await Pet.countDocuments({
      status: 'Reunited',
    });

    // Pet stats by report type
    const totalFoundPets = await Pet.countDocuments({ report_type: 'found' });
    const totalLostPets = await Pet.countDocuments({ report_type: 'lost' });
    const adoptablePets = await Pet.countDocuments({
      status: { $in: ['Available for Adoption', 'Pending Adoption'] },
    });

    // User stats
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalRescuers = await User.countDocuments({ role: 'rescuer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    res.status(200).json({
      success: true,
      data: {
        pending: {
          lost: pendingLostReports,
          found: pendingFoundReports,
          total: pendingLostReports + pendingFoundReports,
        },
        active: {
          lost: listedLostReports,
          found: listedFoundReports,
          total: listedLostReports + listedFoundReports,
        },
        matched: matchedReports,
        reunited: reunitedReports,
        pets: {
          found: totalFoundPets,
          lost: totalLostPets,
          adoptable: adoptablePets,
          total: totalFoundPets + totalLostPets + adoptablePets,
        },
        users: {
          total: totalUsers + totalRescuers + totalAdmins,
          regular: totalUsers,
          rescuers: totalRescuers,
          admins: totalAdmins,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
