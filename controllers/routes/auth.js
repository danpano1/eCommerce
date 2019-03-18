const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../../models/User')
const errorHandler = require('../middleware/errorHandler');


router.get('/login', errorHandler((req, res)=>{

   if (req.cookies.user) return res.redirect('/')
   
    res.render('auth/login', {
        pageTitle: 'Login'
    });
}));


router.post('/login', errorHandler(async (req, res)=>{
    
    const user = await User.findOne({email: req.body.email})
    
    if (!user) return res.status(422).render('auth/login', {
        err: 'Email or password are not correct',
        pageTitle: 'Login',
        mailFromUser: req.body.email
    });

    const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password)
    
    if(!isPasswordCorrect) return res.status(422).render('auth/login', {
        err: 'Email or password are not correct',
        pageTitle: 'Login',
        mailFromUser: req.body.email
    });

    user.setUserCookie(res, (err)=>{

        if(err) next(err);

        if(user.isAdmin) res.redirect('/admin/products')
        
        res.redirect('/');
    })
}));

router.get('/register', errorHandler((req, res)=>{

    if (req.cookies.user) return res.redirect('/')

    res.render('auth/register', {
        pageTitle: 'Register',
        userData: {}
    });
}))

router.post('/register', errorHandler(async (req, res)=>{
    let joiLikeErrors = [];

    const {error} = User.userValidation(req.body);   


    if(error) joiLikeErrors = (error.details)

    if(req.body.password !== req.body.confirmPassword) joiLikeErrors.push({message: 'Passwords do not match'})

    
    const userInputData = {
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
    }

    if (joiLikeErrors.length > 0) return res.status(422).render('auth/register', {
        pageTitle: 'Register',
        errs: joiLikeErrors,
        userData: userInputData
    })
    

    if(await User.findOne({email:req.body.email})) {
        joiLikeErrors.push({message: 'Email already in use'})
        return res.status(400).render('auth/register', {
            pageTitle: 'Register',
            errs: joiLikeErrors,
            userData: userInputData
        })
    }


    const hashedPassword = await User.hashPassword(req.body.password)

    const newUser = new User({
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        password: hashedPassword,
    })

    await newUser.save();

    res.redirect('/login');
    
}))

router.post('/logout', errorHandler((req, res) =>{
    if(req.cookies.user){
        res.clearCookie('user')
    }
    res.redirect('/')
}))




module.exports = router