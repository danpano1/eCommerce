const express = require('express');
const router = express.Router();
const {User, userValidation, setUserCookie} = require('../../models/User')
const bcrypt = require('bcrypt');
const errorHandler = require('../middleware/errorHandler');


router.get('/login', errorHandler((req, res)=>{
    res.render('auth/login', {
        pageTitle: 'Login'
    });
}));


router.post('/login', errorHandler(async (req, res)=>{
    
    const user = await User.findOne({email: req.body.email})
    
    if (!user) return res.status(400).render('auth/login', {
        err: 'Email or password are not correct'
    });

    const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password)
    
    if(!isPasswordCorrect) return res.status(400).render('auth/login', {
        err: 'Email or password are not correct'
    });

    setUserCookie(res, user, ()=>{
        res.redirect('/');
    })
}));

router.get('/register', errorHandler((req, res)=>{
    res.render('auth/register', {
        pageTitle: 'Register',
    });
}))

router.post('/register', errorHandler(async (req, res)=>{
    
    const {error} = userValidation(req.body);
    
    let joiLikeErrors = [];


    if(error) joiLikeErrors = (error.details)

    if(req.body.password !== req.body.confirmPassword) joiLikeErrors.push({message: 'Passwords do not match'})

    if (joiLikeErrors.length > 0) return res.status(400).render('auth/register', {
        pageTitle: 'Register',
        errs: joiLikeErrors
    })
    

    if(await User.findOne({email:req.body.email})) {
        joiLikeErrors.push({message: 'Email already in use'})
        return res.status(400).render('auth/register', {
            pageTitle: 'Register',
            errs: joiLikeErrors
        })
    }


    const hashedPassword = await bcrypt.hash(req.body.password, 12)

    const newUser = new User({
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        password: hashedPassword,
    })

    await newUser.save();

    res.redirect('/');
    
}))

router.post('/logout', errorHandler((req, res) =>{
    if(req.cookies.user){
        res.clearCookie('user')
    }
    res.redirect('/')
}));



module.exports = router