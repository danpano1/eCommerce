const express = require('express');
const router = express.Router();
const {User, userValidation} = require('../../models/User')
const bcrypt = require('bcrypt');


router.get('/login', (req, res)=>{
    res.render('login', {
        pageTitle: 'Login'
    });
});

router.get('/register', (req, res)=>{
    res.render('register', {
        pageTitle: 'Register',
    });
})

router.post('/register', async (req, res)=>{
    
    const {error} = userValidation(req.body);
    
    const joiLikeErrors = [];


    if(error) error.details.forEach((detail)=>{
        joiLikeErrors.push(detail)
    })

    if(req.body.password !== req.body.confirmPassword) joiLikeErrors.push({message: 'Passwords do not match'})

    console.log(joiLikeErrors)
    if (joiLikeErrors.length > 0) return res.status(400).render('register', {
        pageTitle: 'Register',
        errs: joiLikeErrors
    })
    

    if(await User.findOne({email:req.body.email})) {
        joiLikeErrors.push({message: 'Email already in use'})
        return res.status(400).render('register', {
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
    
})


module.exports = router