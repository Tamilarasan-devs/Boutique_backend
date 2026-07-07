const express = require('express');
const router = express.Router();
const { getAppointments, addAppointment, updateAppointmentStatus, deleteAppointment } = require('../controller/appointmentController');

// @route   GET /api/appointments
router.get('/', getAppointments);

// @route   POST /api/appointments
router.post('/', addAppointment);

// @route   PUT /api/appointments/:id/status
router.put('/:id/status', updateAppointmentStatus);

// @route   DELETE /api/appointments/:id
router.delete('/:id', deleteAppointment);

module.exports = router;
