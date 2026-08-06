import validator from "validator"
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from "cloudinary"
import fs from 'fs'
import doctorModel from "../models/doctorModel.js"
import appointmentModel from "../models/appointmentModel.js"
import userModel from "../models/userModel.js"
import jwt from 'jsonwebtoken'

console.log("🔥 adminController.js LOADED")

// API for adding doctors
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address, available } = req.body || {}
        const imageFile = req.file

        // check for all required fields
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address || !imageFile) {
            return res.status(400).json({ success: false, message: "Missing Details" })
        }

        // validate email
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" })
        }

        // validate password length
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Please enter a strong password" })
        }

        // 🔹 Check if doctor with same email already exists
        const existingDoctor = await doctorModel.findOne({ email })
        if (existingDoctor) {
            return res.status(400).json({
                success: false,
                message: "Doctor already exists"
            })
        }

        // hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // upload image to Cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
        const imageUrl = imageUpload.secure_url
        fs.unlink(imageFile.path, () => {})

        // prepare doctor data
        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            available: available === undefined ? true : (available === "true" || available === true),
            date: Date.now()
        }

        // save to database
        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()

        res.status(201).json({ success: true, message: "Doctor Added" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API for admin login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            // create token
            const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1d" })
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to get all appointments list for admin panel
const appointmentsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({}).sort({ date: -1 })
        res.json({ success: true, appointments })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to cancel any appointment (admin only)
const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (!appointmentData) {
            return res.status(404).json({ success: false, message: "Appointment not found" })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // release the doctor slot atomically
        const { docId, slotDate, slotTime } = appointmentData
        await doctorModel.findByIdAndUpdate(docId, { $pull: { [`slots_booked.${slotDate}`]: slotTime } })

        res.json({ success: true, message: "Appointment Cancelled" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to get admin dashboard data
const adminDashboard = async (req, res) => {
    try {
        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            patients: users.length,
            appointments: appointments.length,
            latestAppointments: [...appointments].sort((a, b) => b.date - a.date).slice(0, 5)
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard }