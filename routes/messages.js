let express = require('express');
let router = express.Router();
let messageModel = require('../schemas/messages');
let { CheckLogin } = require('../utils/authHandler');
let { uploadFile } = require('../utils/uploadHandler');
let mongoose = require('mongoose');

// 1. GET /:userID 
router.get('/:userID', CheckLogin, async function (req, res, next) {
    try {
        let me = req.user._id;
        let userID = req.params.userID;

        let messages = await messageModel.find({
            $or: [
                { from: me, to: userID },
                { from: userID, to: me }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).send(messages);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// 2. POST / 
router.post('/', CheckLogin, uploadFile.single('file'), async function (req, res, next) {
    try {
        let me = req.user._id;
        let { to, text } = req.body;
        let messageContent = {};

        if (req.file) {
            messageContent = {
                type: 'file',
                text: req.file.path
            };
        } else {
            messageContent = {
                type: 'text',
                text: text
            };
        }

        let newMessage = new messageModel({
            from: me,
            to: to,
            messageContent: messageContent
        });

        await newMessage.save();
        res.status(200).send(newMessage);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

// 3. GET / 
router.get('/', CheckLogin, async function (req, res, next) {
    try {
        let me = req.user._id;

        let allMessages = await messageModel.find({
            $or: [
                { from: me },
                { to: me }
            ]
        }).sort({ createdAt: -1 });

        let conversations = [];
        let partners = new Set();

        allMessages.forEach(msg => {
            let partnerId = msg.from.toString() === me.toString() ? msg.to.toString() : msg.from.toString();

            if (!partners.has(partnerId)) {
                partners.add(partnerId);
                conversations.push(msg);
            }
        });

        res.status(200).send(conversations);
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

module.exports = router;
