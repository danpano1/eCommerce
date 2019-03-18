const express = require('express');
const router = express.Router();


const Product = require('../../models/Product');
const Cart = require('../../models/Cart');
const User = require('../../models/User');
const Order = require('../../models/Order');
const errorHandler = require('../middleware/errorHandler');
const createInvoicePdf = require('../../utils/invoicePdf');


router.get('/', errorHandler(async (req, res)=>{
    
    const randomProducts = await Product.getRandomProducts(6);
    
    res.render('shop/shopIndex', {
        products: randomProducts.products,
        isEmpty: randomProducts.isEmpty,
        pagePath: '/',
        pageTitle: 'eCommerce'
    })
    
}));


router.get('/products/:id', errorHandler(async (req, res)=>{

    Product.findNotRemoved({_id: req.params.id})
    .then((product)=>{

        if(!product[0]) return res.redirect('/')

        res.render('shop/productPage', {
            img: product[0].imageURL,
            name: product[0].name,
            price: product[0].price,
            description: product[0].description,
            id: product[0]._id,
            pagePath: '/products',
            pageTitle: product[0].name
        })
    })
    .catch((err)=>{

        return res.redirect('/')

    })
   
    
}))

router.get('/products' , errorHandler(async (req, res)=>{

    const pagination = await Product.getProductPagination(req.query.page, 3);   


    res.render('shop/products', {
        products: pagination.products,
        pages: pagination.lastPage,
        pagePath: '/products',
        pageTitle: `Page ${pagination.currentPage}`,
        currentPage: pagination.currentPage,
        isEmpty: pagination.isEmpty
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
        User.verifyUserToken(req.cookies.user, async (user)=>{
            
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
    
    User.verifyUserToken(req.cookies.user, async (user)=>{
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
        
        const {error} = Order.orderValidation(order)

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
        
        newOrder.createOrderToken((err, orderToken)=>{
            
            if(err) return next(err);

            res.redirect(`/orders/${orderToken}`);
        })
    })  
}))

router.get('/orders/:orderToken', async (req, res) => {
    const orderToken = req.params.orderToken;

    Order.verifyOrderToken(orderToken, async (orderEncrypted)=>{

        if (!orderEncrypted) return res.status(400).send('Bad token')
        
        const orderToShow = await Order.getOrdersInfo({_id: orderEncrypted.orderId});
        
        orderToShow[0].token = orderToken
       
       
        res.render('shop/order', {
            order: orderToShow[0]
        })
    })
})

router.get('/invoices/:order', errorHandler((req, res)=>{   


    if (req.cookies.user) {
        User.verifyUserToken(req.cookies.user, (user)=>{
            if(!user) return res.redirect('/')

            Order.getOrdersInfo({_id: req.params.order})
            .then(order=>{
            
                if(!order) return res.redirect('/')

                createInvoicePdf(order[0], res);
            })
            .catch(err=>{
                res.redirect('/')
            })
            
            
            
            
        })        
    } else {
        const orderToken = req.params.order;

        Order.verifyOrderToken(orderToken, async (orderEncrypted)=>{
            
            if(!orderEncrypted) return res.redirect('/')

            const order = await Order.getOrdersInfo({_id: orderEncrypted.orderId})

            createInvoicePdf(order[0], res);

        })
    }
}))



module.exports = router;
