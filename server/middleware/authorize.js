const auth = require('./auth');

// Middleware that wraps auth and checks roles
const authorize = (roles = []) => {
    // Return array of middlewares
    return [
        // 1. Authenticate (Verify Token)
        auth,

        // 2. Authorize (Check Role)
        (req, res, next) => {
            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({ message: 'Yetkisiz işlem. Bu alan için izniniz yok.' });
            }
            next();
        }
    ];
};

module.exports = authorize;
