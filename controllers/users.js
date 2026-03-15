let userModel = require("../schemas/users");
let bcrypt = require('bcrypt')
let jwt = require('jsonwebtoken')
let fs = require('fs')

const privateKey = fs.readFileSync('private.pem', 'utf8')

module.exports = {
    CreateAnUser: async function (username, password, email, role, fullName, avatarUrl, status, loginCount) {
        let newItem = new userModel({
            username: username,
            password: password,
            email: email,
            fullName: fullName,
            avatarUrl: avatarUrl,
            status: status,
            role: role,
            loginCount: loginCount
        });
        await newItem.save();
        return newItem;
    },
    GetAllUser: async function () {
        return await userModel
            .find({ isDeleted: false })
    },
    GetUserById: async function (id) {
        try {
            return await userModel
                .findOne({
                    isDeleted: false,
                    _id: id
                })
        } catch (error) {
            return false;
        }
    },
    QueryLogin: async function (username, password) {
        if (!username || !password) {
            return false;
        }
        let user = await userModel.findOne({
            username: username,
            isDeleted: false
        })
        if (user) {
            if (bcrypt.compareSync(password, user.password)) {
                return jwt.sign({
                    id: user.id
                }, privateKey, {
                    expiresIn: '1d',
                    algorithm: 'RS256'
                })
            } else {
                return false;
            }
        } else {
            return false;
        }
    },
    ChangePassword: async function (id, oldPassword, newPassword) {
        let user = await userModel.findById(id);
        if (!user) {
            return { success: false, message: "User not found" };
        }
        if (bcrypt.compareSync(oldPassword, user.password)) {
            await userModel.findByIdAndUpdate(id, { password: newPassword }, { new: true });
            return { success: true, message: "Password updated successfully" };
        } else {
            return { success: false, message: "Old password is wrong" };
        }
    }
}