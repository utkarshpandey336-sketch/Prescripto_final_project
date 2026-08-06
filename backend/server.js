import express from "express"
import cors from "cors"
import "dotenv/config"
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import adminRouter from "./routes/adminRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import userRouter from "./routes/userRoute.js"

// APP CONFIG
const app = express()
const port = process.env.PORT || 4000

// DEBUG: confirm correct server is running
console.log("🔥🔥 PRESCRIPTO BACKEND SERVER RUNNING 🔥🔥")

// DB & CLOUDINARY
connectDB()
connectCloudinary()

// MIDDLEWARES
app.use(express.json())
app.use(cors())

// TEST ROOT ROUTE (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.send("HELLO FROM PRESCRIPTO BACKEND")
})

// ADMIN ROUTES
app.use("/api/admin", adminRouter)

// DOCTOR ROUTES
app.use("/api/doctor", doctorRouter)

// USER ROUTES
app.use("/api/user", userRouter)

// FALLBACK (optional, for debugging)
app.use((req, res) => {
  res.status(404).send(`Cannot ${req.method} ${req.originalUrl}`)
})

// START SERVER
app.listen(port, () => {
  console.log(`✅ Server started on port ${port}`)
})