var express = require('express');
var router = express.Router();
let roleModel = require('../schemas/roles');
let userModel = require('../schemas/users');

// READ ALL
router.get('/', async function (req, res, next) {
  let result = await roleModel.find({
    isDeleted: false
  });
  res.send(result);
});

// READ ONE
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await roleModel.findOne({
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
    let newRole = new roleModel({
      name: req.body.name,
      description: req.body.description
    });
    await newRole.save();
    res.send(newRole);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// GET ALL USERS BY ROLE ID
router.get('/:id/users', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await userModel.find({
      role: id,
      isDeleted: false
    });
    res.send(result);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

module.exports = router;
