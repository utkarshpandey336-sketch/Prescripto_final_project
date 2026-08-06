import mongoose from "mongoose"
import bcrypt from "bcrypt"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import { v2 as cloudinary } from "cloudinary"
import doctorModel from "../models/doctorModel.js"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
})

const doctors = [
    {
        name: "Dr. Richard James",
        speciality: "General physician",
        degree: "MBBS",
        experience: "4 Years",
        fees: 50,
        address: {
            line1: "17th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    },
    {
        name: "Dr. Emily Larson",
        speciality: "Gynecologist",
        degree: "MBBS",
        experience: "3 Years",
        fees: 60,
        address: {
            line1: "27th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    },
    {
        name: "Dr. Sarah Patel",
        speciality: "Dermatologist",
        degree: "MBBS",
        experience: "1 Years",
        fees: 30,
        address: {
            line1: "37th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    },
    {
        name: "Dr. Christopher Lee",
        speciality: "Pediatricians",
        degree: "MBBS",
        experience: "2 Years",
        fees: 40,
        address: {
            line1: "47th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    },
    {
        name: "Dr. Jennifer Garcia",
        speciality: "Neurologist",
        degree: "MBBS",
        experience: "4 Years",
        fees: 50,
        address: {
            line1: "57th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    },
    {
        name: "Dr. Andrew Williams",
        speciality: "Neurologist",
        degree: "MBBS",
        experience: "4 Years",
        fees: 50,
        address: {
            line1: "57th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    },
    {
        name: "Dr. Christopher Davis",
        speciality: "General physician",
        degree: "MBBS",
        experience: "4 Years",
        fees: 50,
        address: {
            line1: "17th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    },
    {
        name: "Dr. Timothy White",
        speciality: "Gynecologist",
        degree: "MBBS",
        experience: "3 Years",
        fees: 60,
        address: {
            line1: "27th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    },
    {
        name: "Dr. Ava Mitchell",
        speciality: "Dermatologist",
        degree: "MBBS",
        experience: "1 Years",
        fees: 30,
        address: {
            line1: "37th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    },
    {
        name: "Dr. Jeffrey King",
        speciality: "Pediatricians",
        degree: "MBBS",
        experience: "2 Years",
        fees: 40,
        address: {
            line1: "47th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    },
    {
        name: "Dr. Zoe Kelly",
        speciality: "Neurologist",
        degree: "MBBS",
        experience: "4 Years",
        fees: 50,
        address: {
            line1: "57th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    },
    {
        name: "Dr. Patrick Harris",
        speciality: "Neurologist",
        degree: "MBBS",
        experience: "4 Years",
        fees: 50,
        address: {
            line1: "57th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    },
    {
        name: "Dr. Chloe Evans",
        speciality: "General physician",
        degree: "MBBS",
        experience: "4 Years",
        fees: 50,
        address: {
            line1: "17th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    },
    {
        name: "Dr. Ryan Martinez",
        speciality: "Gynecologist",
        degree: "MBBS",
        experience: "3 Years",
        fees: 60,
        address: {
            line1: "27th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    },
    {
        name: "Dr. Amelia Hill",
        speciality: "Dermatologist",
        degree: "MBBS",
        experience: "1 Years",
        fees: 30,
        address: {
            line1: "37th Cross, Richmond",
            line2: "Circle, Ring Road, London"
        }
    }
]

const aboutText =
    "Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies. Dr. Davis has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies."

const runSeed = async () => {
    try {
        console.log("Connecting to MongoDB...")

        // Your MONGODB_URI already points to the prescripto database.
        // Do NOT append /prescripto again.
        await mongoose.connect(process.env.MONGODB_URI)

        console.log("Database connected")

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash("Doctor@123", salt)

        for (let i = 0; i < doctors.length; i++) {
            const doctor = doctors[i]
            const imagePath = path.join(__dirname, `doc${i + 1}.png`)

            // Skip doctors that already exist.
            const existingDoctor = await doctorModel.findOne({
                name: doctor.name
            })

            if (existingDoctor) {
                console.log(`Skipping ${doctor.name} - already exists`)
                continue
            }

            console.log(`Uploading image for ${doctor.name}...`)

            const imageUpload = await cloudinary.uploader.upload(imagePath, {
                resource_type: "image",
                folder: "prescripto/doctors"
            })

            const doctorData = {
                name: doctor.name,
                email: `${doctor.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, ".")
                    .replace(/\.$/, "")}@prescripto.test`,
                image: imageUpload.secure_url,
                password: hashedPassword,
                speciality: doctor.speciality,
                degree: doctor.degree,
                experience: doctor.experience,
                about: aboutText,
                fees: doctor.fees,
                address: doctor.address,
                available: true,
                date: Date.now()
            }

            await doctorModel.create(doctorData)

            console.log(`Added ${doctor.name}`)
        }

        console.log("================================")
        console.log("Doctor seeding completed!")
        console.log("Test doctor password: Doctor@123")
        console.log("================================")

    } catch (error) {
        console.error("SEED ERROR:", error)
    } finally {
        await mongoose.connection.close()
        console.log("MongoDB connection closed")
    }
}

runSeed()