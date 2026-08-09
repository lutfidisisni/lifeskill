const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_lifeskill_2026';
            const decoded = jwt.verify(token, jwtSecret);
            req.user = decoded;
            return next();
        } catch (error) {
            console.error('JWT verification error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    return res.status(401).json({ message: 'Not authorized, no token' });
};

module.exports = { protect };
