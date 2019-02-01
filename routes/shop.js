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

router.post('/cart', async (req, res)=>{
    const backURL = req.header('Referer')
    console.log(req.body.productID);
    res.redirect(backURL);
})

module.exports = router;
