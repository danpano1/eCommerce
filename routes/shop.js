const express = require('express');
const router = express.Router();
const {getRandomProducts} = require('../models/Product')
const {Product} = require('../models/Product')


router.get('/', async (req, res)=>{

    const productsToShow = await getRandomProducts(6);
    
    res.render('shopIndex', {
        products: productsToShow,
        pagePath: '/',
        pageTitle: 'eCommerce'
    })
    
});

router.get('/products/:id', async (req, res)=>{
    const product = await Product.findById(req.params.id);
    res.render('productPage', {
        img: product.imageURL,
        name: product.name,
        price: product.price,
        description: product.description,
        id: product._id,
        pagePath: '/',
        pageTitle: product.name
    })
})

router.get('/cart', async (req, res)=>{
    const cart = req.signedCookies.cart
    let productsToDisplay = [];

    if(!cart) return res.render('cart')
    
    const products = cart.items
    
    for(let i = 0; i<products.length; i++){
        
        const productFromDB = await Product.findById(products[i].id);
        
        productsToDisplay.push({
            id: productFromDB._id,
            name: productFromDB.name,
            price: productFromDB.price,
            imageURL: productFromDB.imageURL,
            quantity: products[i].quantity
        });      

    }       
    res.render('cart', {
        products: productsToDisplay
    });
    
        
})



router.post('/cart', async (req, res)=>{
    const productAdded = req.body.productID;
    const backURL = req.header('Referer');
    
    if(req.signedCookies.cart){
        let products = req.signedCookies.cart.items
        
        const existingProductIndex = products.findIndex((item)=>item.id === productAdded);
        
        if(existingProductIndex>=0) products[existingProductIndex].quantity++

        else products.push({id: productAdded, quantity: 1})

        res.cookie('cart', {items: products}, { signed: true, httpOnly: true}, )
        

        return res.redirect(backURL)
    }
    
    res.cookie('cart', {
        items: [
            {
                id: productAdded,
                quantity: 1

            }
        ]
    }, 
    {
        signed: true,
        httpOnly: true
    });

    res.redirect(backURL);
});



module.exports = router;
