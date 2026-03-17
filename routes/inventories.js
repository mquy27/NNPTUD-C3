var express = require('express');
var router = express.Router();
let inventoryModel = require('../schemas/inventories');

router.get('/', async function (req, res, next) {
    let result = await inventoryModel.find().populate('product');
    res.send(result);
});

router.get('/:id', async function (req, res, next) {
    try {
        let id = req.params.id;
        let result = await inventoryModel.findOne({
            _id: id
        }).populate('product');

        if (result) {
            res.send(result);
        } else {
            res.status(404).send({ message: "Ko tim thay ID" });
        }
    } catch (error) {
        res.status(404).send({ message: error.message });
    }
});

router.post('/add_stock', async function (req, res, next) {
    try {
        let { product, quantity } = req.body;

        if (!product || quantity === undefined) {
            return res.status(400).send({ message: "Cung cap ID product va quantity" });
        }

        if (quantity <= 0) {
            return res.status(400).send({ message: "Quantity phai lon hon 0" });
        }

        let updatedInventory = await inventoryModel.findOneAndUpdate(
            { product: product },
            { $inc: { stock: quantity } },
            { new: true }
        ).populate('product');

        if (updatedInventory) {
            res.send(updatedInventory);
        } else {
            res.status(404).send({ message: "Ko tim thay inventory" });
        }
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.post('/remove_stock', async function (req, res, next) {
    try {
        let { product, quantity } = req.body;

        if (!product || quantity === undefined) {
            return res.status(400).send({ message: "Cung cap ID product va quantity" });
        }

        if (quantity <= 0) {
            return res.status(400).send({ message: "Quantity phai lon hon 0" });
        }

        let updatedInventory = await inventoryModel.findOneAndUpdate(
            { product: product, stock: { $gte: quantity } },
            { $inc: { stock: -quantity } },
            { new: true }
        ).populate('product');

        if (updatedInventory) {
            res.send(updatedInventory);
        } else {
            return res.status(400).send({ message: "Ko tim thay inventory hoac so luong ton kho khong du" });
        }
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

router.post('/reservation', async function (req, res, next) {
    try {
        let { product, quantity } = req.body;

        if (!product || quantity === undefined) {
            return res.status(400).send({ message: "Cung cap ID product va quantity" });
        }

        if (quantity <= 0) {
            return res.status(400).send({ message: "Quantity phai lon hon 0" });
        }
        let updatedInventory = await inventoryModel.findOneAndUpdate(
            { product: product, stock: { $gte: quantity } },
            { $inc: { stock: -quantity, reserved: quantity } },
            { new: true }
        ).populate('product');

        if (updatedInventory) {
            res.send(updatedInventory);
        } else {
            return res.status(400).send({ message: "Ko tim thay inventory hoac so luong ton kho khong du de giu cho" });
        }
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});
router.post('/sold', async function (req, res, next) {
    try {
        let { product, quantity } = req.body;

        if (!product || quantity === undefined) {
            return res.status(400).send({ message: "Cung cap ID product va quantity" });
        }

        if (quantity <= 0) {
            return res.status(400).send({ message: "Quantity phai lon hon 0" });
        }

        let updatedInventory = await inventoryModel.findOneAndUpdate(
            { product: product, reserved: { $gte: quantity } },
            { $inc: { reserved: -quantity, soldCount: quantity } },
            { new: true }
        ).populate('product');

        if (updatedInventory) {
            res.send(updatedInventory);
        } else {
            return res.status(400).send({ message: "Ko tim thay inventory hoac so luong dat truoc khong du de ban" });
        }
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
});

module.exports = router;
