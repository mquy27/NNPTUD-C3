var express = require('express');
var router = express.Router();
let productModel = require('../schemas/products');
const { default: slugify } = require('slugify');

// READ ALL
router.get('/', async function (req, res, next) {
  let result = await productModel.find({
    isDeleted: false
  });
  res.send(result);
});

// READ ONE
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await productModel.findOne({
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
    let newProduct = new productModel({
      title: req.body.title,
      slug: slugify(req.body.title, {
        replacement: '-',
        remove: undefined,
        lower: true,
        strict: false,
      }),
      price: req.body.price,
      description: req.body.description,
      images: req.body.images,
      category: req.body.category
    });
    await newProduct.save();
    res.send(newProduct);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
});

// UPDATE
router.put('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    // Generate new slug if title is updated
    if (req.body.title) {
      req.body.slug = slugify(req.body.title, {
        replacement: '-',
        lower: true,
      });
    }
    let updatedItem = await productModel.findByIdAndUpdate(id, req.body, {
      new: true
    });
    if (updatedItem) {
      res.send(updatedItem);
    } else {
      res.status(404).send({ message: "ID NOT FOUND" });
    }
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});

// DELETE (Soft Delete)
router.delete('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await productModel.findByIdAndUpdate(id, {
      isDeleted: true
    }, {
      new: true
    });
    if (updatedItem) {
      res.send(updatedItem);
    } else {
      res.status(404).send({ message: "ID NOT FOUND" });
    }
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});

module.exports = router;

