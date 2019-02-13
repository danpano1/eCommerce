const express = require('express');
const router = express.Router();
const {Product, productValidation} = require('../../models/Product');
const errorHandler = require('../middleware/errorHandler');



router.post('/addproduct', errorHandler(async (req, res) =>{
      const {error} = productValidation(req.body);
    
    if(error) return res.status(400).render('admin/addProduct', {
        pagePath: '/admin/addproduct',
        pageTitle: 'Add product',
        errs: error.details
    });

    if(await Product.findOne({name:req.body.name})) return res.status(400).render('admin/addProduct', {
        pagePath: '/admin/addproduct',
        pageTitle: 'Add product',
        errs: ['Product already exist']
    });

    const newProduct = new Product({
        name: req.body.name,
        price: parseInt(req.body.price),
        imageURL: req.body.imageURL,
        description: req.body.description,
        quantity: parseInt(req.body.quantity)
    });

    await newProduct.save();

    res.render('admin/productSent', {
        pagePath: '/admin/addproduct',
        pageTitle: 'Added product',
        name: newProduct.name,
        price: newProduct.price,
        img: newProduct.imageURL,
        description: newProduct.description,
    })

 
}));

router.get('/addproduct', errorHandler((req, res)=>{
    res.render('admin/addProduct', {
        pagePath: '/admin/addproduct',
        pageTitle: 'Add product'
    });
}))

module.exports = router;