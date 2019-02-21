const express = require('express');
const router = express.Router();
const {getRandomProducts} = require('../../models/Product')
const {Product} = require('../../models/Product')
const Cart = require('../../models/Cart')
const errorHandler = require('../middleware/errorHandler');
const {User, verifyUserToken} = require('../../models/User')


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

router.get('/orderdata', errorHandler(async (req, res, next)=>{

    if(!req.signedCookies.cart) return res.redirect('/cart')

    const products = await Cart.getItemsFromDB(req);
    const wholePrice = Cart.countWholePrice(products)
    
    if (req.cookies.user){
        verifyUserToken(req.cookies.user, async (user)=>{
            
            if(!user) return res.status(401).send('Bad token')

            const userInfo = await User.findById(user.id);
            const {name, surname, email, country, city, postCode, streetAdress} = userInfo;
            res.render('shop/orderData', {
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
                wholePrice: wholePrice
            })
        })
    } else {
        res.render('shop/orderData', {
            pageTitle: "Order data",
            products: products,
            wholePrice: wholePrice
        })
    }


}))



module.exports = router;
