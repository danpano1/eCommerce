const express = require('express');
const router = express.Router();
const {getRandomProducts} = require('../../models/Product')
const {Product} = require('../../models/Product')
const Cart = require('../../models/Cart')
const errorHandler = require('../middleware/errorHandler');
const {User, verifyUserToken} = require('../../models/User')
const {Order, orderValidation, createOrderToken, verifyOrderToken} = require('../../models/Order')
const createInvoicePdf = require('../../utils/invoicePdf')


router.get('/', errorHandler(async (req, res)=>{
    
    const productsToShow = await getRandomProducts(6);
    
    res.render('shop/shopIndex', {
        products: productsToShow,
        pagePath: '/',
        pageTitle: 'eCommerce'
    })
    
}));


router.get('/products/:id', errorHandler(async (req, res)=>{

    Product.findById(req.params.id)
    .then((product)=>{

        if(!product) return res.redirect('/')

        res.render('shop/productPage', {
            img: product.imageURL,
            name: product.name,
            price: product.price,
            description: product.description,
            id: product._id,
            pagePath: '/products',
            pageTitle: product.name
        })
    })
    .catch((err)=>{

        return res.redirect('/')

    })
   
    
}))

router.get('/products' , errorHandler(async (req, res)=>{
    
    let prodPerPage = 1;

    let page = req.query.page || 1;
        
    if(isNaN(page)) return res.status(400).send('Page must be a number')
    page = parseInt(page)
    if(page<1) page = 1
        
    const numberOfProd = await Product.countDocuments();

    const lastPage = Math.ceil((numberOfProd/prodPerPage))

    if(page>lastPage) page = lastPage    

    let prodsToSkip = prodPerPage*(page-1);
    const prodsToShow = [];

    if (prodPerPage*page > numberOfProd) prodPerPage += numberOfProd - prodPerPage*page;
         

    for(let i = 0; i<prodPerPage; i++){
        const productFromDb = await Product.findOne().skip(prodsToSkip);

        prodsToShow.push({
            id: productFromDb._id,
            name: productFromDb.name,
            price: productFromDb.price,
            img: productFromDb.imageURL
        })

        prodsToSkip++
        
    }

    res.render('shop/products', {
        products: prodsToShow,
        pages: lastPage,
        pagePath: '/products',
        pageTitle: `Page ${page}`,
        currentPage: page
    })


}))

router.get('/cart', errorHandler(async (req, res)=>{
    const cart = req.signedCookies.cart
    

    if(!cart) return res.render('shop/cart')
    
    
    res.render('shop/cart', {
        products: await Cart.getItemsFromDB(req)
    });
    
        
}));



router.post('/cart', errorHandler(async (req, res)=>{
    const backURL = req.header('Referer');
    
    if(req.body.productID){
        const productAdded = req.body.productID;
        if(req.signedCookies.cart){

            if(req.signedCookies.cart.items.find((item)=>item.id === productAdded)){
                Cart.addQuantity(req, res, productAdded);
            } else{
                Cart.addProduct(req, res, productAdded);
            }
        } else{
            new Cart(res, productAdded);
        }
    }
    
    if(req.body.productIDdec){
        Cart.decQuantity(req, res, req.body.productIDdec)
    }
        
   
    return res.redirect(backURL);
    
}));

router.get('/ordering', errorHandler(async (req, res)=>{

    if(!req.signedCookies.cart) return res.redirect('/cart')

    const products = await Cart.getItemsFromDB(req);
    const wholePrice = Cart.countWholePrice(products)
    const validationErr = req.cookies.error
    
    if (req.cookies.user){
        verifyUserToken(req.cookies.user, async (user)=>{
            
            if(!user) return res.status(401).send('Bad token')

            const userInfo = await User.findById(user.id);

            const {name, surname, email, country, city, postCode, streetAdress} = userInfo;
            res.render('shop/ordering', {
                pageTitle: "Order data",
                name: name,
                surname: surname,
                email: email,
                country: country,
                city: city,
                postCode: postCode,
                streetAdress, streetAdress,
                userId: userInfo._id,
                products: products,
                wholePrice: wholePrice,
                errs: validationErr
            })
        })
    } else {
        res.render('shop/ordering', {
            pageTitle: "Order data",
            products: products,
            wholePrice: wholePrice,
            errs: validationErr
        })
    }


}))

router.post('/ordering', errorHandler(async (req, res, next)=>{
    let products = [];
    let userId = "";
    
    if(typeof req.body.productId === "string") 
    {
        products.push({
            productId: req.body.productId,
            productQuantity: req.body.productQuantity
        })
    } else {
        for(let i=0; i<req.body.productId.length; i++){
            
            products.push( {
                productId: req.body.productId[i],
                productQuantity: req.body.productQuantity[i]
            })
        }        
    }      
    
    verifyUserToken(req.cookies.user, async (user)=>{
        let userFromDB = null;

        if(user){
        userId = user.id
        userFromDB = await User.findById(userId)
        }       

        const order = {
            products: products,
            name: req.body.name,
            surname: req.body.surname,
            email: req.body.email,
            country: req.body.country,
            postCode: req.body.postCode,
            city: req.body.city,
            streetAdress: req.body.streetAdress,
            userId: userId
        }
        
        const {error} = orderValidation(order)

        if (error) {
            const errors = []
           
            error.details.forEach((err)=>{
                errors.push({message: err.message})
            })                       
            
            res.cookie('error', errors, {
                maxAge: 2000
            })
            return res.redirect('/ordering')
        }

        if(userFromDB) {
            userFromDB.country = req.body.country
            userFromDB.postCode = req.body.postCode
            userFromDB.city = req.body.city
            userFromDB.streetAdress = req.body.streetAdress

            userFromDB.save();
        }
        

        const newOrder = new Order(order);

        await newOrder.save();

        res.clearCookie('cart');

        if(userFromDB) return res.redirect('/myorders')
        
        createOrderToken(newOrder._id, (err, orderToken)=>{
            
            if(err) return next(err);

            res.redirect(`/orders/${orderToken}`);
        })
    })  
}))

router.get('/orders/:orderToken', async (req, res) => {
    const orderToken = req.params.orderToken;

    verifyOrderToken(orderToken, async (orderEncrypted)=>{

        if (!orderEncrypted) return res.status(400).send('Bad token')
        
        const orderFromDb = await Order.findById(orderEncrypted.orderId);

        let products = [];
        let wholeValue = 0;
        
        for(let i = 0; i<orderFromDb.products.length; i++){
            const product = await Product.findById(orderFromDb.products[i].productId)

            products.push({
                imageURL: product.imageURL,
                name: product.name,
                price: product.price,
                quantity: orderFromDb.products[i].productQuantity,
            })      
            wholeValue += orderFromDb.products[i].productQuantity * product.price
        }

        const order = {
            token: orderToken,         
            orderDate: orderFromDb.orderDate,
            name: orderFromDb.name,
            surname: orderFromDb.surname,
            email: orderFromDb.email,
            postCode: orderFromDb.postCode,
            city: orderFromDb.city,
            streetAdress: orderFromDb.streetAdress,
            country: orderFromDb.country,
            products: products,
            wholePrice: wholeValue
        }

        res.render('shop/order', {
            order: order
        })
    })
})

router.get('/invoices/:order', errorHandler((req, res)=>{   


    if (req.cookies.user) {
        verifyUserToken(req.cookies.user, (user)=>{
            if(!user) return res.redirect('/')

            const orderId = req.params.order

            Order.findById(orderId)
            .then((order)=>{ 
                if(!order) return res.redirect('/')
                
                createInvoicePdf(order, res);
                
                
            })
            .catch((err)=>{
                res.redirect('/')
            })
        })        
    } else {
        const orderToken = req.params.order;

        verifyOrderToken(orderToken, async (orderEncrypted)=>{
            
            if(!orderEncrypted) return res.redirect('/')

            const order = await Order.findById(orderEncrypted.orderId)

            createInvoicePdf(order, res);

        })
    }
}))



module.exports = router;
