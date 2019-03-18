const mongoose = require('mongoose');
const Joi = require('joi');
const jwt = require('jsonwebtoken');

const Product = require('./Product')
const {privateJWTkey} = require('../config/config')

const Schema = mongoose.Schema;

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
    city:{
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



orderSchema.statics.orderValidation = (order) => {

    const products = Joi.object().keys({
        productId: Joi.string().regex(/^[a-f\d]{24}$/i).required(),
        productQuantity: Joi.number().greater(0).required(),
    })

    const schema = {
        products: Joi.array().items(products).required(),
        userId: Joi.any().optional(),
        name: Joi.string().required(),
        surname: Joi.string().required(),
        email: Joi.string().email().required(),
        country: Joi.string().required(),
        city: Joi.string().required(),
        postCode: Joi.string().required(),
        streetAdress: Joi.string().required()
    }
    
    const result = Joi.validate(order, schema, {
        abortEarly: false
    })

    return result
}


orderSchema.statics.verifyOrderToken = (orderToken, cb)=>{
    jwt.verify(orderToken, privateJWTkey, (err, orderEncrypted)=>{

        let order = false;

        if(!err) order = orderEncrypted;

        cb(order);
    })
}

orderSchema.methods.createOrderToken = function (cb){
    jwt.sign({orderId: this._id}, privateJWTkey, (err, orderToken)=>{

        cb(err, orderToken);
    })
}


orderSchema.statics.getOrderPagination = async function (pageNumber, ordersPerPage, querySettings = {}){
    let page = pageNumber || 1;
        
    if(isNaN(page)) page = 1

    page = parseInt(page)
    
    if(page<1) page = 1
        
    const numberOfOrders = await this.countDocuments(querySettings);

    const lastPage = Math.ceil((numberOfOrders/ordersPerPage))

    if(page>lastPage) page = lastPage    

    let ordersToSkip = ordersPerPage*(page-1);    

    if (ordersPerPage*page > numberOfOrders) ordersPerPage += numberOfOrders - ordersPerPage*page;

    const ordersToShow = await this.getOrdersInfo(querySettings, ordersToSkip, ordersPerPage)
   
    return {
        orders: ordersToShow,
        lastPage: lastPage,
        currentPage: page
    }      
        
}
orderSchema.statics.getOrdersInfo = async function (queryOrderSettings = {}, ordersToSkip = 0, orderLimit = 1){
        
    let ordersFromDb = [];
    let ordersFullInfo = [];
    let productsToFind = []; 
    let wholeOrderPrice = 0;   
    

    ordersFromDb = await this.find(queryOrderSettings).skip(ordersToSkip).limit(orderLimit);

    for (let i = 0; i<ordersFromDb.length; i++){
            
        ordersFullInfo.push({

            orderId: ordersFromDb[i]._id,
            orderDate: ordersFromDb[i].orderDate,
            name: ordersFromDb[i].name,
            surname: ordersFromDb[i].surname,
            email: ordersFromDb[i].email,
            postCode: ordersFromDb[i].postCode,
            city: ordersFromDb[i].city,
            streetAdress: ordersFromDb[i].streetAdress,
            country: ordersFromDb[i].country,
            products: []
        })   
    
        ordersFromDb[i].products.forEach(product =>{
    
            productsToFind.push(mongoose.Types.ObjectId(product.productId));
                
            ordersFullInfo[i].products.push({quantity: product.productQuantity, id: mongoose.Types.ObjectId(product.productId)});
        })

    }          
        
    
    productsFromDb = await Product.find({
        _id: {
            $in: productsToFind
        }
    })    
    
    ordersFullInfo.forEach((order, j, ordersArray) =>{

        order.products.forEach((product, i, prodArray) =>{
            

            const prodToFind = productsFromDb.find(prodFromDb => JSON.stringify(prodFromDb._id) === JSON.stringify(product.id));
                      
                        

            const tempObject = {            
                imageURL: prodToFind.imageURL,
                name: prodToFind.name,
                price: prodToFind.price,
            }

            wholeOrderPrice += tempObject.price*product.quantity
            
            prodArray[i] = {...prodArray[i], ...tempObject};
        })

        ordersArray[j].wholePrice = wholeOrderPrice;
        wholeOrderPrice = 0;     
    })

    return ordersFullInfo;
}    

module.exports = mongoose.model('Order', orderSchema);