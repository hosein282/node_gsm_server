// src/controllers/userController.js
const db = require('../repository/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateAccessToken = (user) => {
    return jwt.sign(user, process.env.JWT_SECRET_TOKEN, { expiresIn: '1h' });
};

const generateRefreshToken = (user) => {
    return jwt.sign(user, process.env.JWT_REFRESH_TOKEN);
};


const createUser = async (req, res, next) => {

    try {
        const { username, password, phone } = req.body;

        const user = await db.read('users', [], { 'username': username });
        if (user.length > 0) {

            return res.status(409).json({ error: 'این نام کاربری قبلا ثبت شده است' });
        } else {
            try {
                // Hash the password before saving
                const hashedPassword = await bcrypt.hash(password, 10);
                console.log(`hashedPassword: ${hashedPassword}`);
                // ایجاد کاربر جدید
                const result = await db.create('users', { 'username': username, 'password': hashedPassword, });

                const newUser = await db.read('users', ['id', 'username', 'phone'], { 'username': username });
                if (newUser.length) {

                    // Generate JWT token
                    const accessToken = generateAccessToken({ id: newUser[0].id, username: newUser[0].username });
                    const refreshToken = generateRefreshToken({ id: newUser[0].id, username: newUser[0].username });
                    console.log(`accessToken: ${accessToken}`);
                    console.log(`refreshToken: ${refreshToken}`);
                    res.status(200).json({ success: true, user: newUser[0], accessToken, refreshToken });
                }
            } catch (err) {
                next(err);
            }
        }
    } catch (err) {
        next(err);
    }


};

const getUserByName = async (req, res, next) => {
    const { username } = req.query;
    console.log(username);
    try {
        //دریافت کاربر با یوزر نیم
        const result = await db.read('users', ['id,username'], { 'username': username });
        res.status(200).json(result[0]);
    } catch (err) {
        next(err)
    }
}

const getUsers = async (req, res, next) => {
    const { username, password } = req.body;
    try {

        // دریافت تمام کاربران
        const users = await db.read('users', ['id', 'username', 'password'], { 'username': username });
        if (users.length === 0) {
            return res.status(400).json({ error: 'نام کاربری یا رمز عبور نادرست است' });
        }
        // Compare the password
        const isMatch = await bcrypt.compare(password, users[0].password);

        if (!isMatch) {
            return res.status(400).json({ error: 'نام کاربری یا رمز عبور نادرست است' });
        }

        const accessToken = generateAccessToken({ id: users[0].id, username: users[0].username });
        const refreshToken = generateRefreshToken({ id: users[0].id, username: users[0].username });

        delete users[0]['password'];
        res.json({ "user": users[0], accessToken, refreshToken });
    } catch (err) {
        next(err);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email } = req.body;

        // بروزرسانی کاربر
        await db.update('users', { name, email }, { id });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        // حذف کاربر
        await db.delete('users', { id });
        res.json({ success: true });
    } catch (err) {
        next(err);
    }
};
const refreshToken = (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_TOKEN);
        const accessToken = generateAccessToken({ id: decoded.id, username: decoded.username });
        const refreshToken = generateRefreshToken({ id: decoded.id, username: decoded.username });

        res.json({ success: true, accessToken ,refreshToken});
    } catch (err) {
        res.status(400).json({ error: 'Invalid refresh token.' });
    }
};

module.exports = {
    createUser,
    getUserByName,
    getUsers,
    updateUser,
    deleteUser,
    refreshToken
};
