const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Joi = require('joi');
const jwt = require('jsonwebtoken')

const privateJWTkey = 'privateKey'

const userSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    surname:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true
    },
    country:{
        type: String,
    },
    city:{
        type: String,
    },
    postCode:{
        type: String,
    },
    streetAdress:{
        type: String,
    },
    isAdmin:{
        type: Boolean,
        default: false
    },

});

const User = mongoose.model('User', userSchema);

const userValidation = (user)=>{
    const schema = {
        name: Joi.string().min(3).required(),
        surname: Joi.string().min(3).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(5).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]/).required(),
        confirmPassword: Joi.string()
                   
    }
    return Joi.validate(user , schema, {
        abortEarly: false
    })

}

const setUserCookie = async (res, user, cb) =>{
    
    jwt.sign({
        id: user._id,
        isAdmin: user.isAdmin
    }, privateJWTkey, {
        expiresIn: '1h'
    }, (err, userToken) =>{
        if (err) return res.status(500)
        
        res.cookie('user', userToken, {
            expires: new Date(Date.now() + 3600000),
        });
        cb();
    })
}

const verifyUserToken = (token, cb) =>{
    jwt.verify(token, privateJWTkey, (err, userEncrypted)=>{
        
        let user = false
        
        if (!err) user = userEncrypted
        
        cb(user)
    })
}

module.exports.User = User;
module.exports.userValidation = userValidation;
module.exports.setUserCookie = setUserCookie;
module.exports.verifyUserToken = verifyUserToken;