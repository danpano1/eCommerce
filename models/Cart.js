const {Product} = require('../models/Product');

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
        
        for(let i = 0; i<products.length; i++){
            
            const productFromDB = await Product.findById(products[i].id);
            
            if(products[i].quantity>0) {

                productsToDisplay.push({
                    id: productFromDB._id,
                    name: productFromDB.name,
                    price: productFromDB.price,
                    imageURL: productFromDB.imageURL,
                    quantity: products[i].quantity
                });      
        
            }
        
        }   
        
        return productsToDisplay
    }
}