let express = require('express')
let router = express.Router()
let { uploadImage, uploadExcel } = require('../utils/uploadHandler')
let path = require('path')
let exceljs = require('exceljs')
let fs = require('fs')
let categoriesModel = require('../schemas/categories')
let productsModel = require('../schemas/products')
let inventoryModel = require('../schemas/inventories')
let mongoose = require('mongoose')
let slugify = require('slugify')
let userModel = require('../schemas/users')
let roleModel = require('../schemas/roles')
let { sendPasswordMail } = require('../utils/sendMail')
let crypto = require('crypto')

router.post('/one_image', uploadImage.single('file'), function (req, res, next) {
    if (!req.file) {
        res.status(404).send({
            message: "file not found"
        })
    } else {
        console.log(req.body);
        res.send({
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size
        })
    }
})
router.post('/multiple_images', uploadImage.array('files', 5), function (req, res, next) {
    if (!req.files) {
        res.status(404).send({
            message: "file not found"
        })
    } else {
        console.log(req.body);
        res.send(req.files.map(f => ({
            filename: f.filename,
            path: f.path,
            size: f.size
        })))
    }
})
router.get('/:filename', function (req, res, next) {
    let pathFile = path.join(
        __dirname, '../uploads', req.params.filename
    )
    res.sendFile(pathFile)
})

router.post('/excel', uploadExcel.single('file'), async function (req, res, next) {
    if (!req.file) {
        res.status(404).send({
            message: "file not found"
        })
    } else {
        //workbook->worksheet->column/row->cell
        let workbook = new exceljs.Workbook();
        let pathFile = path.join(
            __dirname, '../uploads', req.file.filename
        )
        await workbook.xlsx.readFile(pathFile)
        let worksheet = workbook.worksheets[0];
        let result = []
        let categories = await categoriesModel.find({
        });
        let categoriesMap = new Map();
        for (const category of categories) {
            categoriesMap.set(category.name, category._id)
        }
        let products = await productsModel.find({})
        let getTitle = products.map(p => p.title)
        let getSku = products.map(p => p.sku)

        for (let index = 2; index <= worksheet.rowCount; index++) {
            let errorsInRow = []
            const element = worksheet.getRow(index);
            let sku = element.getCell(1).value;
            let title = element.getCell(2).value;
            let category = element.getCell(3).value;

            let price = Number.parseInt(element.getCell(4).value)
            let stock = Number.parseInt(element.getCell(5).value)

            if (price < 0 || isNaN(price)) {
                errorsInRow.push("price khong hop le")
            }
            if (stock < 0 || isNaN(stock)) {
                errorsInRow.push("stock khong hop le")
            }
            if (!categoriesMap.has(category)) {
                errorsInRow.push('category khong hop le')
            }
            if (getSku.includes(sku)) {
                errorsInRow.push('sku bi trung')
            }
            if (getTitle.includes(title)) {
                errorsInRow.push('title khong hop le')
            }
            if (errorsInRow.length > 0) {
                result.push({
                    success: false,
                    data: errorsInRow
                });
                continue;
            }// 

            try {
                let newProduct = new productsModel({
                    sku: sku,
                    title: title,
                    slug: slugify(title, {
                        replacement: '-',
                        remove: undefined,
                        lower: true,
                        strict: false,
                    }),
                    price: price,
                    description: title,
                    category: categoriesMap.get(category)
                });
                newProduct = await newProduct.save();
                let newInventory = new inventoryModel({
                    product: newProduct._id,
                    stock: stock
                })
                newInventory = await newInventory.save();
                newInventory = await newInventory.populate('product')
                getTitle.push(title);
                getSku.push(sku)
                result.push({
                    success: true,
                    data: newInventory
                })
            } catch (error) {
                result.push({
                    success: false,
                    data: error.message
                })
            }

        }
        fs.unlinkSync(pathFile)
        res.send(result.map(function (r, index) {
        if (r.success) {
            return { [index + 1]: r.data }
        } else {
            return { [index + 1]: Array.isArray(r.data) ? r.data.join(',') : r.data }
        }
        }))
    }
})

router.post('/excel_users', uploadExcel.single('file'), async function (req, res, next) {
    if (!req.file) {
        return res.status(404).send({
            message: "file not found"
        })
    }
    let workbook = new exceljs.Workbook();
    let pathFile = path.join(
        __dirname, '../uploads', req.file.filename
    )
    await workbook.xlsx.readFile(pathFile)
    let worksheet = workbook.worksheets[0];
    let result = []

    let userRole = await roleModel.findOne({ name: /user/i });
    if (!userRole) {
        fs.unlinkSync(pathFile);
        return res.status(400).send({ message: "Role user not found" });
    }

    let existingUsers = await userModel.find({})
    let getUsernames = existingUsers.map(u => u.username)
    let getEmails = existingUsers.map(u => u.email)

    for (let index = 2; index <= worksheet.rowCount; index++) {
        let errorsInRow = []
        const element = worksheet.getRow(index);

        const getCellValue = (cell) => {
            const val = cell.value;
            if (val === null || val === undefined) return null;
            if (typeof val === 'object') {
                return (val.text || val.result || (val.richText ? val.richText.map(rt => rt.text).join('') : null) || String(val)).trim();
            }
            return String(val).trim();
        };
        let username = getCellValue(element.getCell(1));
        let email = getCellValue(element.getCell(2));

        if (!username) {
            errorsInRow.push("username is required")
        }
        if (!email) {
            errorsInRow.push("email is required")
        }
        if (getUsernames.includes(username)) {
            errorsInRow.push("username bi trung")
        }
        if (getEmails.includes(email)) {
            errorsInRow.push("email bi trung")
        }

        if (errorsInRow.length > 0) {
            result.push({
                success: false,
                data: errorsInRow
            });
            continue;
        }

        let password = crypto.randomBytes(8).toString('hex');

        try {
            let newUser = new userModel({
                username: username,
                email: email,
                password: password,
                role: userRole._id
            });
            newUser = await newUser.save();

            getUsernames.push(username);
            getEmails.push(email);

            await sendPasswordMail(email, password).catch(console.error);

            result.push({
                success: true,
                data: {
                    username: newUser.username,
                    email: newUser.email,
                    generatedPassword: password, // Mật khẩu ngẫu nhiên 16 kí tự (chưa mã hoá)
                    role: newUser.role
                }
            })
        } catch (error) {
            result.push({
                success: false,
                data: error.message
            })
        }

    }
    fs.unlinkSync(pathFile)
    res.send(result.map(function (r, index) {
        if (r.success) {
            return { [index + 1]: r.data }
        } else {
            return { [index + 1]: Array.isArray(r.data) ? r.data.join(',') : r.data }
        }
    }))
})

module.exports = router;