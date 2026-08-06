import validator from "validator"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { v2 as cloudinary } from "cloudinary"
import razorpay from "razorpay"
import crypto from "crypto"
import fs from "fs"
import userModel from "../models/userModel.js"
import doctorModel from "../models/doctorModel.js"
import appointmentModel from "../models/appointmentModel.js"

// API to register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Missing Details" })
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: "Please enter a valid email" })
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Please enter a strong password (min 8 characters)" })
        }

        const existingUser = await userModel.findOne({ email })
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists, please login" })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({ name, email, password: hashedPassword })
        const user = await newUser.save()

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })

        res.status(201).json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Missing Details" })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(400).json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" })
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {
    try {
        const userId = req.userId
        const userData = await userModel.findById(userId).select('-password')

        if (!userData) {
            return res.status(404).json({ success: false, message: "User not found" })
        }

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId
        const { name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.status(400).json({ success: false, message: "Missing Details" })
        }

        const updateData = { name, phone, dob, gender }

        if (address) {
            updateData.address = JSON.parse(address)
        }

        await userModel.findByIdAndUpdate(userId, updateData)

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(
                imageFile.path,
                { resource_type: "image" }
            )

            fs.unlink(imageFile.path, () => { })

            await userModel.findByIdAndUpdate(
                userId,
                { image: imageUpload.secure_url }
            )
        }

        res.json({ success: true, message: "Profile Updated" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// API to book appointment
const bookAppointment = async (req, res) => {
    try {
        const userId = req.userId
        const { docId, slotDate, slotTime } = req.body

        if (!docId || !slotDate || !slotTime) {
            return res.status(400).json({ success: false, message: "Missing Details" })
        }

        const docData = await doctorModel.findById(docId).select('-password')

        if (!docData) {
            return res.status(404).json({ success: false, message: "Doctor not found" })
        }

        if (!docData.available) {
            return res.status(400).json({ success: false, message: "Doctor not available" })
        }

        // Atomically reserve the slot
        const slotPath = `slots_booked.${slotDate}`

        const reservedDoc = await doctorModel.findOneAndUpdate(
            {
                _id: docId,
                [slotPath]: { $ne: slotTime }
            },
            {
                $push: { [slotPath]: slotTime }
            },
            {
                new: true
            }
        )

        if (!reservedDoc) {
            return res.status(400).json({
                success: false,
                message: "This slot is already booked"
            })
        }

        const userData = await userModel.findById(userId).select('-password')

        if (!userData) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        const docDataForAppointment = { ...docData.toObject() }
        delete docDataForAppointment.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData: docDataForAppointment,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)

        try {
            await newAppointment.save()
        } catch (saveError) {
            // Roll back slot reservation if appointment creation fails
            await doctorModel.findByIdAndUpdate(
                docId,
                { $pull: { [slotPath]: slotTime } }
            )

            throw saveError
        }

        res.status(201).json({
            success: true,
            message: "Appointment Booked"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// API to get user appointments
const listAppointment = async (req, res) => {
    try {
        const userId = req.userId

        const appointments = await appointmentModel
            .find({ userId })
            .sort({ date: -1 })

        res.json({
            success: true,
            appointments
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const userId = req.userId
        const { appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            })
        }

        // Verify appointment belongs to logged in user
        if (appointmentData.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized action"
            })
        }

        if (appointmentData.cancelled) {
            return res.status(400).json({
                success: false,
                message: "Appointment already cancelled"
            })
        }

        await appointmentModel.findByIdAndUpdate(
            appointmentId,
            { cancelled: true }
        )

        // Release the doctor slot atomically
        const { docId, slotDate, slotTime } = appointmentData

        await doctorModel.findByIdAndUpdate(
            docId,
            {
                $pull: {
                    [`slots_booked.${slotDate}`]: slotTime
                }
            }
        )

        res.json({
            success: true,
            message: "Appointment Cancelled"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Initialize Razorpay instance lazily
const getRazorpayInstance = () => {
    return new razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    })
}

// API to create a Razorpay order for an appointment
const paymentRazorpay = async (req, res) => {
    try {
        const userId = req.userId
        const { appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found"
            })
        }

        if (appointmentData.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized action"
            })
        }

        if (appointmentData.cancelled) {
            return res.status(400).json({
                success: false,
                message: "Appointment cancelled or not found"
            })
        }

        if (appointmentData.payment) {
            return res.status(400).json({
                success: false,
                message: "Appointment already paid"
            })
        }

        const razorpayInstance = getRazorpayInstance()

        const options = {
            amount: appointmentData.amount * 100,
            currency: process.env.CURRENCY || "INR",
            receipt: appointmentId,
        }

        const order = await razorpayInstance.orders.create(options)

        // Store order ID against appointment
        await appointmentModel.findByIdAndUpdate(
            appointmentId,
            { razorpayOrderId: order.id }
        )

        res.json({
            success: true,
            order
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// API to verify Razorpay payment signature server-side
const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Missing payment details"
            })
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex")

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            })
        }

        const appointmentData = await appointmentModel.findOne({
            razorpayOrderId: razorpay_order_id
        })

        if (!appointmentData) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found for this order"
            })
        }

        // Verify that the appointment belongs to the logged in user
        const userId = req.userId

        if (appointmentData.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized action"
            })
        }

        if (appointmentData.payment) {
            return res.json({
                success: true,
                message: "Payment already verified"
            })
        }

        await appointmentModel.findByIdAndUpdate(
            appointmentData._id,
            {
                payment: true,
                razorpayPaymentId: razorpay_payment_id
            }
        )

        res.json({
            success: true,
            message: "Payment Successful"
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentRazorpay,
    verifyRazorpay
}