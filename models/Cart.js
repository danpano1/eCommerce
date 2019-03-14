const {Product} = require('../models/Product');
const mongoose = require('mongoose')

module.exports = class Cart {
    constructor(res, product){
        res.cookie('cart', {
            items: [
                {
                    id: product,
                    quantity: 1
    
                }
            ]
        }, 
        {
            signed: true,
            httpOnly: true
        });
    }


    static addProduct(req, res, product){
        let products = req.signedCookies.cart.items
        products.push({id: product, quantity: 1})
        this.sendCart(res, products);
    }

    static addQuantity(req, res, product){
        let products = req.signedCookies.cart.items;
        const existingProductIndex = products.findIndex((item)=>item.id === product);
        products[existingProductIndex].quantity++
        this.sendCart(res, products);
    }
    static decQuantity(req, res, product){
        let products = req.signedCookies.cart.items;
        const existingProductIndex = products.findIndex((item)=>item.id === product);
        products[existingProductIndex].quantity--
        if(products[existingProductIndex].quantity === 0) products.splice(existingProductIndex, 1)
        this.sendCart(res, products);
    }
    
    static sendCart(res, products){
        res.cookie('cart', {items: products}, { signed: true, httpOnly: true});
    }

    static async getItemsFromDB(req){

        let productsToDisplay = [];
        const products = req.signedCookies.cart.items
        let prodIds = []
        
        products.forEach((prod)=>{
            prodIds.push(mongoose.Types.ObjectId(prod.id))
        })

        const productsFromDB = await Product.find({
            _id:{
                $in: prodIds
            }
        })
        
        for(let i = 0; i<productsFromDB.length; i++){
            if(products[i].quantity>0) {

                productsToDisplay.push({
                    id: productsFromDB[i]._id,
                    name: productsFromDB[i].name,
                    price: productsFromDB[i].price,
                    imageURL: productsFromDB[i].imageURL,
                    quantity: products[i].quantity});      
        
            }

        }
               
        return productsToDisplay
    }

    static countWholePrice (products){
        let wholePrice = 0;

        products.forEach((prod)=>{
            wholePrice += prod.price*prod.quantity
            
        })
        return wholePrice
    }
}