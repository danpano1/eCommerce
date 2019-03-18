const express = require('express');
const router = express.Router();

const User = require('../../models/User')
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const errorHandler = require('../middleware/errorHandler');

router.get('/profile', errorHandler(async (req, res)=>{

    const user = res.locals.user
         
    const userInfo = await User.findById(user.id);
    
    const infoToSend = {
        fullName: `${userInfo.name} ${userInfo.surname}`,
        email: userInfo.email
    }

    res.render('user/profile', {
        info: infoToSend,
        pageTitle: `${infoToSend.fullName}`
    })
        
    
    
}));

router.get('/myorders', errorHandler(async (req, res)=>{
    const user = res.locals.user
    let orders = [];    
    
    let userOrders = await Order.find({
        userId: user.id
    }).sort('-orderDate')

    for(let i = 0; i<userOrders.length; i++) {

        let wholeValue = 0;
        let products = [];

        for(let x = 0; x<userOrders[i].products.length; x++){          

            const product = await Product.findById(userOrders[i].products[x].productId);
                        
            products.push({
                imageURL: product.imageURL,
                name: product.name,
                price: product.price,
                quantity: userOrders[i].products[x].productQuantity,
            })      
            wholeValue += userOrders[i].products[x].productQuantity * product.price
        }
        orders.push({
            orderId: userOrders[i]._id,
            orderDate: userOrders[i].orderDate,
            name: userOrders[i].name,
            surname: userOrders[i].surname,
            email: userOrders[i].email,
            postCode: userOrders[i].postCode,
            city: userOrders[i].city,
            streetAdress: userOrders[i].streetAdress,
            country: userOrders[i].country,
            products: products,
            wholePrice: wholeValue
        })
    }
    
    res.render('user/myorders', {
        pageTitle: "Your orders",
        pagePath: "/myorders",
        orders: orders});
    
}))


router.get('/changepassword', errorHandler((req, res)=>{
    res.render('user/changepassword',{
        pageTitle: "Change password",        
    })
}))

router.post('/changepassword', errorHandler(async (req, res)=>{
    const userId = res.locals.user.id;
    let joiLikeErrors = [];
    

    const {error} = User.changePasswordValidation({newPassword: req.body.newPassword})

    if (error) joiLikeErrors = (error.details)
    
    const isPasswordCorrect = await User.comparePassword(req.body.currentPassword, userId)
    

    if(!isPasswordCorrect) joiLikeErrors.push({message: 'Current password is not correct'})

    if(req.body.newPassword!==req.body.confNewPassword) joiLikeErrors.push({message: 'New passwords do not match'})  
    
    

    if (joiLikeErrors.length>0) return res.render('user/changepassword',{
        pageTitle: "Change password",
        errs: joiLikeErrors        
    })


    const hashedNewPassword = await User.hashPassword(req.body.newPassword)

    
    await User.findOneAndUpdate({_id: userId}, {password: hashedNewPassword});

    res.render('user/changepassword',{
        pageTitle: "Change password",
        done: true        
    })

}))

module.exports = router
