var express = require('express');
var router = express.Router();
let userModel = require('../schemas/users');

// READ ALL
router.get('/', async function (req, res, next) {
  let result = await userModel.find({
    isDeleted: false
  });
  res.send(result);
});

// READ ONE
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await userModel.findOne({
      _id: id,
      isDeleted: false
    });
    if (result) {
      res.send(result);
    } else {
      res.status(404).send({ message: "ID NOT FOUND" });
    }
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});

// CREATE
router.post('/', async function (req, res, next) {
  try {
    let newUser = new userModel(req.body);
    await newUser.save();
    res.send(newUser);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// ENABLE USER
router.post('/enable', async function (req, res, next) {
  try {
    let { email, username } = req.body;

    let _user = await userModel.findOne({
      email: email,
      username: username,
      isDeleted: false
    });

    if (_user) {
      _user.status = true;
      await _user.save();
      res.send(_user);
    } else {
      res.status(404).send({ message: "Không tìm thấy user khớp email và username" });
    }
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// DISABLE USER
router.post('/disable', async function (req, res, next) {
  try {
    let { email, username } = req.body;
    let _user = await userModel.findOne({
      email: email,
      username: username,
      status: true,
      isDeleted: false
    });
    if (_user) {
      _user.status = false;
      await _user.save();
      res.send(_user);
    } else {
      res.status(404).send({ message: "Không tìm thấy user" })
    }
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});
module.exports = router;
