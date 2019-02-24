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
        default: ""
    },
    city:{
        type: String,
        default: ""
    },
    postCode:{
        type: String,
        default: ""
    },
    streetAdress:{
        type: String,
        default: ""
    },
    isAdmin:{
        type: Boolean,
        default: false
    },

});

const User = mongoose.model('User', userSchema);

const userValidation = (user)=>{
    const schema = {
        name: Joi.string().trim().min(3).max(12).required(),
        surname: Joi.string().trim().min(3).max(12).required(),
        email: Joi.string().trim().email().lowercase().required(),
        password: Joi.string().trim().min(5).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]/).error((errs)=>{
            return(errs.map((err)=>{
                if (err.type === 'string.regex.base')
                return {message : '"password" must contain at least 5 characters including one: number, big and small letter'}
            else
                return {message : '"password" is reqruired and must be a string'};
            }))
        }).required(),        
        confirmPassword: Joi.string().trim(),
        _csrf: Joi.required(),
                   
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

        if (err) return cb(err)
        
        res.cookie('user', userToken, {
            expires: new Date(Date.now() + 3600000),
        });
        cb();
    })
}

const verifyUserToken = async (token, cb) =>{
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