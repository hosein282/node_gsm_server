// src/controllers/userController.js
const db = require('../repository/database');

const createUser = async (req, res, next) => {

    const { username, password } = req.body;
    const user = await db.read('users', [], { 'username': username });

    if (user.length > 0) {

        return res.status(500).json({ error: 'این نام کاربری قبلا ثبت شده است' });
    } else {
        try {
            // ایجاد کاربر جدید
            const result = await db.create('users', { username, password });
            const newUser = await db.read('users', ['id', 'username'], { 'username': username });
            if (newUser.length) {
                res.status(200).json({ success: true, id: newUser[0] });

            }
        } catch (err) {
            next(err);
        }
    }
};

const getUserByName = async (req, res, next) => {
    const { username } = req.body;

    try {
        //دریافت کاربر با یوزر نیم
        const result = await db.read('users', ['id,username'], { 'username': username });
        res.status(200).json({ result });
    } catch (err) {
        next(err)
    }
}

const getUsers = async (req, res, next) => {
    const { username, password } = req.body;

    try {
        // دریافت تمام کاربران
        const users = await db.read('users', ['id', 'username'], { 'username': username, 'password': password });
        if (!users.length) {
            return res.status(400).json({ error: 'نام کاربری یا رمز عبور نادرست است' });
        }
        res.json(users[0]);
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

module.exports = {
    createUser,
    getUserByName,
    getUsers,
    updateUser,
    deleteUser,
};
