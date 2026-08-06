import jwt from "jsonwebtoken"

// doctor authentication middleware
const authDoctor = async (req, res, next) => {
    try {
        const { dtoken } = req.headers

        if (!dtoken) {
            return res.status(401).json({ success: false, message: "Not Authorized, login again" })
        }

        const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)
        req.docId = token_decode.id

        next()
    } catch (error) {
        console.log(error)
        return res.status(401).json({ success: false, message: "Invalid or expired token" })
    }
}

export default authDoctor
