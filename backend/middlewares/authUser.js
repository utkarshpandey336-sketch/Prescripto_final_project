import jwt from "jsonwebtoken"

// user authentication middleware
const authUser = async (req, res, next) => {
    try {
        const { token } = req.headers
        console.log("Checking user token");

        if (!token) {
            return res.status(401).json({ success: false, message: "Not Authorized, login again" })
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = token_decode.id

        next()
    } catch (error) {
        console.log(error)
        return res.status(401).json({ success: false, message: "Invalid or expired token" })
    }
}

export default authUser
