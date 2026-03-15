let mongoose = require('mongoose');
let roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "name khong duoc rong"],
        unique: [true, "name phai la duy nhat"]
    },
    description: {
        type: String,
        default: ""
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('role', roleSchema);