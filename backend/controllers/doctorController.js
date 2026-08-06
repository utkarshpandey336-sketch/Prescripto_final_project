import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import doctorModel from "../models/doctorModel.js"
import appointmentModel from "../models/appointmentModel.js"

// API to change doctor availability (used from admin panel)
const changeAvailability = async (req, res) => {
    try {
        const { docId } = req.body
        const docData = await doctorModel.findById(docId)
        if (!docData) {
            return res.status(404).json({ success: false, message: "Doctor not found" })
        }
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: "Availability Changed" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to get list of all doctors for the public frontend (no sensitive data)
const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password -email')
        res.json({ success: true, doctors })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API for doctor login
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Missing Details" })
        }

        const doctor = await doctorModel.findOne({ email })
        if (!doctor) {
            return res.status(400).json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, doctor.password)
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" })
        }

        const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, { expiresIn: "1d" })
        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to get doctor's own appointments
const appointmentsDoctor = async (req, res) => {
    try {
        const docId = req.docId
        const appointments = await appointmentModel.find({ docId }).sort({ date: -1 })
        res.json({ success: true, appointments })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to mark an appointment as completed (doctor only, own appointments only)
const appointmentComplete = async (req, res) => {
    try {
        const docId = req.docId
        const { appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (!appointmentData) {
            return res.status(404).json({ success: false, message: "Appointment not found" })
        }

        if (appointmentData.docId !== docId) {
            return res.status(403).json({ success: false, message: "Unauthorized action" })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
        res.json({ success: true, message: "Appointment Completed" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to cancel an appointment (doctor only, own appointments only)
const appointmentCancel = async (req, res) => {
    try {
        const docId = req.docId
        const { appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (!appointmentData) {
            return res.status(404).json({ success: false, message: "Appointment not found" })
        }

        if (appointmentData.docId !== docId) {
            return res.status(403).json({ success: false, message: "Unauthorized action" })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // release the slot atomically
        const { slotDate, slotTime } = appointmentData
        await doctorModel.findByIdAndUpdate(docId, { $pull: { [`slots_booked.${slotDate}`]: slotTime } })

        res.json({ success: true, message: "Appointment Cancelled" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to get doctor dashboard data
const doctorDashboard = async (req, res) => {
    try {
        const docId = req.docId
        const appointments = await appointmentModel.find({ docId })

        let earnings = 0
        appointments.forEach(item => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients = []
        appointments.forEach(item => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.sort((a, b) => b.date - a.date).slice(0, 5)
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to get doctor profile
const doctorProfile = async (req, res) => {
    try {
        const docId = req.docId
        const profileData = await doctorModel.findById(docId).select('-password')
        res.json({ success: true, profileData })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to update doctor profile (doctor only, limited fields)
const updateDoctorProfile = async (req, res) => {
    try {
        const docId = req.docId
        const { fees, address, available, about } = req.body

        const updateData = {}
        if (fees !== undefined) updateData.fees = fees
        if (address !== undefined) updateData.address = JSON.parse(address)
        if (available !== undefined) updateData.available = available
        if (about !== undefined) updateData.about = about

        await doctorModel.findByIdAndUpdate(docId, updateData)
        res.json({ success: true, message: "Profile Updated" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

export {
    changeAvailability,
    doctorList,
    loginDoctor,
    appointmentsDoctor,
    appointmentComplete,
    appointmentCancel,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile
}
