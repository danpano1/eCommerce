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
       
    
    let orderPagination = await Order.getOrderPagination(req.query.page, 3, {userId: user.id}, '-orderDate') 
        
    res.render('user/myorders', {
        pageTitle: "Your orders",
        pagePath: "/myorders",
        orders: orderPagination.orders,        
        pages: orderPagination.lastPage,
        currentPage: orderPagination.currentPage
    });
    
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
