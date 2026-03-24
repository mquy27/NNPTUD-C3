const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    secure: false, // Use true for port 465, false for port 587
    auth: {
        user: "99c7a352860940",
        pass: "f73ab5f24ed757",
    },
});

module.exports = {
    sendMail: async function (to, url) {
        await transporter.sendMail({
            from: 'admin@haha.com',
            to: to,
            subject: "reset password email",
            text: "click vao day de doi pass", // Plain-text version of the message
            html: "click vao <a href=" + url + ">day</a> de doi pass", // HTML version of the message
        })
    },
    sendPasswordMail: async function (to, password) {
        await transporter.sendMail({
            from: 'admin@haha.com',
            to: to,
            subject: "Your new account password",
            text: `Your account has been created. Your password is: ${password}`,
            html: `Your account has been created. Your password is: <b>${password}</b>`,
        })
    }
}

// Send an email using async/await
