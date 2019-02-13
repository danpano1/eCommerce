const express = require('express');
const router = express.Router();
const {User, verifyUserToken} = require('../../models/User')
const errorHandler = require('../middleware/errorHandler');

router.get('/orders', (req, res)=>{

})

router.get('/profile', errorHandler(async (req, res)=>{
    const userToken = req.cookies.user

    verifyUserToken(userToken, async (user)=>{
        
    const userInfo = await User.findById(user.id);
    
    const infoToSend = {
        fullName: `${userInfo.name} ${userInfo.surname}`,
        email: userInfo.email
    }

    res.render('user/profile', {
        info: infoToSend
    })
        
    })
    
}));

module.exports = router
