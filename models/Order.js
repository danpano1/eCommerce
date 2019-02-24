const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Joi = require('joi');

const orderSchema = new Schema({
    products:{
        type: Array,
        required: true
    },
    userId: {
        type: String,
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    isSent: {
        type: Boolean,
        default: false
    },
    sendDate: {
        type: Date
    },
    name:{
        type: String,
        required: true
    },
    surname:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    country:{
        type: String,
        required: true
    },
    postCode:{
        type: String,
        required: true
    },   
    streetAdress:{
        type: String,
        required: true
    },

})

const Order = mongoose.model('Order', orderSchema);

const products = Joi.object().keys({
    productId: Joi.string().regex(/^[a-f\d]{24}$/i).required(),
    productQuantity: Joi.number().greater(0).required()
})

const orderValidation = (order) => {
    const schema = {
        products: Joi.array().items(products).required(),
        userId: Joi.any().optional(),
        name: Joi.string().required(),
        surname: Joi.string().required(),
        email: Joi.string().email().required(),
        country: Joi.string().required(),
        postCode: Joi.string().required(),
        streetAdress: Joi.string().required()
    }
    
    const result = Joi.validate(order, schema, {
        abortEarly: false
    })

    return result
}

module.exports.Order = Order
module.exports.orderValidation = orderValidation