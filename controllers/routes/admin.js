const express = require('express');
const router = express.Router();

const Product = require('../../models/Product');
const Order = require('../../models/Order');
const errorHandler = require('../middleware/errorHandler');


router.get('/products', errorHandler(async (req, res)=>{

    const pagination = await Product.getProductPagination(req.query.page, 3);

    res.render('admin/products', {
        products: pagination.products,
        pages: pagination.lastPage,
        pagePath: '/admin/products',
        pageTitle: `Page ${pagination.currentPage}`,
        currentPage: pagination.currentPage,
        isEmpty: pagination.isEmpty
    })

}))

router.get('/products/:id', errorHandler((req, res)=>{
    
    Product.findNotRemoved({_id: req.params.id})
    .then((product)=>{

        if(!product[0]) return res.redirect('/admin/products')
        
        const productToShow = {
            name: product[0].name,
            price: product[0].price,
            description: product[0].description,
            imageURL: product[0].imageURL,
            quantity: product[0].quantity,   
            id: product[0]._id            
        }

        res.render('admin/postProduct', {
            product: productToShow,   
            pagePath: '/admin/products',
            pageTitle: product[0].name,            
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

    const {error} = Product.productValidation(req.body);
      
    
    if(error) return res.status(422).render('admin/postProduct', {
        pagePath: '/admin/products',      
        pageTitle: 'Add product',
        product: productDataFromUser,
        errs: error.details
    });
    
    
    let productToUpdate = await Product.findById(req.body.id)
    const productWithTheSameName = await Product.findNotRemoved({name:req.body.name}) 
    

    if(productWithTheSameName.length > 0) {
        if (productWithTheSameName[0]._id.toString() !== req.body.id){            
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

      const {error} = Product.productValidation(req.body);
    
    if(error) return res.status(422).render('admin/postProduct', {
        pagePath: '/admin/addproduct',
        pageTitle: 'Add product',
        product: productDataFromUser,
        errs: error.details
    });

    const productWithSameName = await Product.findNotRemoved({name: req.body.name})

    if(productWithSameName.length > 0) return res.status(422).render('admin/postProduct', {
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

    const productToDelete = await Product.findById(productId)

    productToDelete.isRemoved = true

    await productToDelete.save()

    res.redirect(backURL)

}))

router.get('/orders', errorHandler(async (req, res)=>{
    let ordersToShow = [];
    let notFound = false;
    let lastPage = 0;
    let currentPage = 0;
    
    if(req.query.id){
        idToFind = req.query.id
        
        try{
            ordersToShow = await Order.getOrdersInfo({_id: req.query.id})
        }
        catch(err){
            notFound = true
        }
        

        if (ordersToShow.length === 0) notFound = true
    }
    else
    {
        const paginationToShow = await Order.getOrderPagination(req.query.page, 4, {}, 'isSent')

        ordersToShow = paginationToShow.orders;
        lastPage = paginationToShow.lastPage;
        currentPage = paginationToShow.currentPage 
    }



    res.render('admin/orders', {
        pagePath: '/admin/orders',
        pageTitle: 'User orders',
        orders: ordersToShow,
        pages: lastPage,
        currentPage: currentPage,
        notFound: notFound
    })
   
}))

router.post('/orders/makesent', errorHandler(async (req, res)=>{
    const backURL =  req.header('Referer');

    const orderIdToChange = req.body.id;

    const orderToChange = await Order.findById(orderIdToChange);

    orderToChange.isSent = true;

    await orderToChange.save();

    res.redirect(backURL)
}))

module.exports = router;