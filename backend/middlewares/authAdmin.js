import jwt from "jsonwebtoken"

// admin authentication middleware
const authAdmin = async (req, res, next) => {
    try {
        // get token from headers
        const { atoken } = req.headers

        if (!atoken) {
            return res.status(401).json({
                success: false,
                message: "Not Authorized, login again"
            })
        }

        // verify token
        const token_decode = jwt.verify(atoken, process.env.JWT_SECRET)

        // check admin role
        if (token_decode.role !== "admin") {
            return res.status(401).json({
                success: false,
                message: "Not Authorized, login again"
            })
        }

        // attach admin info (optional but good practice)
        req.admin = token_decode

        next()
    } catch (error) {
        console.log(error)
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        })
    }
}

export default authAdmin