const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema({
    sendData: {
        type: Object,
        required: true,
        trim: true
    },
    resultData: {
        type: Object,
        required: true,
        trim: true
    }
},{collection: "payment", timestamps: true})

const payment = mongoose.model("payment", paymentSchema)

module.exports = payment