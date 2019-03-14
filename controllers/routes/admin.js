const express = require('express');
const router = express.Router();
const {Product, productValidation, getPagination} = require('../../models/Product');
const errorHandler = require('../middleware/errorHandler');


router.get('/products', errorHandler(async (req, res)=>{

    const pagination = await getPagination(req.query.page, 3);

    res.render('admin/products', {
        products: pagination.products,
        pages: pagination.lastPage,
        pagePath: '/admin/products',
        pageTitle: `Page ${pagination.currentPage}`,
        currentPage: pagination.currentPage
    })

}))

router.get('/products/:id', errorHandler((req, res)=>{
    
    Product.findById(req.params.id)
    .then((product)=>{

        if(!product) return res.redirect('/admin')
        
        const productToShow = {
            name: product.name,
            price: product.price,
            description: product.description,
            imageURL: product.imageURL,
            quantity: product.quantity,   
            id: product._id            
        }

        res.render('admin/postProduct', {
            product: productToShow,   
            pagePath: '/admin/products',
            pageTitle: product.name,            
        })
    })
    .catch((err)=>{

        return res.redirect('/')

    })
}))

router.post('/products/:id', errorHandler(async (req, res)=>{
    
    const productDataFromUser = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        imageURL: req.body.imageURL,
        quantity: req.body.quantity,
        id: req.body.id   
    }

    const {error} = productValidation(req.body);
      
    
    if(error) return res.status(422).render('admin/postProduct', {
        pagePath: '/admin/products',      
        pageTitle: 'Add product',
        product: productDataFromUser,
        errs: error.details
    });
    
    
    let productToUpdate = await Product.findById(req.body.id)
    const productWithTheSameName = await Product.findOne({name:req.body.name}) 
    

    if(productWithTheSameName) {
        if (productWithTheSameName._id.toString() !== req.body.id){            
            return res.status(422).render('admin/postProduct', {
                pagePath: '/admin/products',
                pageTitle: 'Add product',
                product: productDataFromUser,
                errs: [{message: 'Name already used'}]

            });
        }
    }    
    
    parseInt(productDataFromUser.price)
    parseInt(productDataFromUser.quantity)
    delete productDataFromUser.id

    Object.assign(productToUpdate, productDataFromUser)  

    await productToUpdate.save();

    res.render('admin/productSent', {
        pagePath: '/admin/products',
        pageTitle: 'Added product',
        product: productToUpdate
    })


}))

router.post('/addproduct', errorHandler(async (req, res) =>{
    
    const productDataFromUser = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        imageURL: req.body.imageURL,
        quantity: req.body.quantity,
        id: ""  
    }

      const {error} = productValidation(req.body);
    
    if(error) return res.status(422).render('admin/postProduct', {
        pagePath: '/admin/addproduct',
        pageTitle: 'Add product',
        product: productDataFromUser,
        errs: error.details
    });

    if(await Product.findOne({name:req.body.name})) return res.status(422).render('admin/postProduct', {
        pagePath: '/admin/addproduct',
        pageTitle: 'Add product',
        product: productDataFromUser,
        errs: [{message: 'Name already used'}]
    });

    parseInt(productDataFromUser.price)
    parseInt(productDataFromUser.quantity)
    delete productDataFromUser.id
    

    const newProduct = new Product(productDataFromUser);

    await newProduct.save();

    res.render('admin/productSent', {
        pagePath: '/admin/addproduct',
        pageTitle: 'Added product',
        product: newProduct
    })

 
}));

router.get('/addproduct', errorHandler((req, res)=>{
    res.render('admin/postProduct', {
        pagePath: '/admin/addproduct',
        pageTitle: 'Add product'
    });
}))

router.post('/deleteproduct', errorHandler(async (req, res)=>{
    const backURL = req.header('Referer');

    const productId = req.body.productID

    await Product.findByIdAndDelete(productId)

    res.redirect(backURL)

}))

module.exports = router;