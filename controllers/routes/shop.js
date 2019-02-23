const express = require('express');
const router = express.Router();
const {getRandomProducts} = require('../../models/Product')
const {Product} = require('../../models/Product')
const Cart = require('../../models/Cart')
const errorHandler = require('../middleware/errorHandler');
const {User, verifyUserToken} = require('../../models/User')
const {Order, orderValidation} = require('../../models/Order')


router.get('/', errorHandler(async (req, res)=>{
    
    const productsToShow = await getRandomProducts(6);
    
    res.render('shop/shopIndex', {
        products: productsToShow,
        pagePath: '/',
        pageTitle: 'eCommerce'
    })
    
}));


router.get('/products/:id', errorHandler(async (req, res)=>{
    const product = await Product.findById(req.params.id);
    res.render('shop/productPage', {
        img: product.imageURL,
        name: product.name,
        price: product.price,
        description: product.description,
        id: product._id,
        pagePath: '/',
        pageTitle: product.name
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

router.post('/ordering', errorHandler(async (req, res)=>{
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
        if(user) userId = user

        const order = {
            products: products,
            name: req.body.name,
            surname: req.body.surname,
            email: req.body.email,
            country: req.body.country,
            postCode: req.body.postCode,
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
      
        const newOrder = new Order(order);

        await newOrder.save();

        res.clearCookie('cart');

        res.render('shop/ordered', {
            pageTitle: 'Ordered',            
        })
    })
}))



module.exports = router;
