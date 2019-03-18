const mongoose = require('mongoose');
const Joi = require('joi');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');

const {privateJWTkey, saltForPassword} = require('../config/config')

const Schema = mongoose.Schema;

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

userSchema.statics.userValidation = (user)=>{
    const schema = {
        name: Joi.string().trim().min(3).max(12).required(),
        surname: Joi.string().trim().min(3).max(12).required(),
        email: Joi.string().trim().email().lowercase().required(),
        password: Joi.string().trim().min(5).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]/).required().error((errs)=>{
            return(errs.map((err)=>{
            if (err.type === 'string.regex.base')
                return {message : '"password" must contain at least 5 characters including one: number, big and small letter'}
            if (err.type === 'any.empty')
                return {message : '"password" is reqruired'};
            else 
                return {message : '"password" must be a string'};
            }))
        }),               
        confirmPassword: Joi.string().trim(),
        _csrf: Joi.required(),
        
    }
    
    return  Joi.validate(user , schema, {
        abortEarly: false
})
}

userSchema.statics.changePasswordValidation = (password) => {
    const schema = {
        newPassword: Joi.string().trim().min(5).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]/).required().error((errs)=>{
            return(errs.map((err)=>{
            if (err.type === 'string.regex.base')
                return {message : '"newPassword" must contain at least 5 characters including one: number, big and small letter'}
            if (err.type === 'any.empty')
                return {message : '"newPassword" is reqruired'};
            else 
                return {message : '"newPassword" must be a string'};
            }))
        }),  
   
    }

    return Joi.validate(password , schema, {
        abortEarly: false
    })
}

userSchema.methods.setUserCookie = async function (res, cb){
    
    jwt.sign({
        id: this._id,
        isAdmin: this.isAdmin
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

userSchema.statics.verifyUserToken = async (token, cb) =>{
    jwt.verify(token, privateJWTkey, (err, userEncrypted)=>{
        
        let user = false
        
        if (!err) user = userEncrypted
        
        cb(user)
    })
}

userSchema.statics.hashPassword = async (password) =>{
    const hashedPassword = await bcrypt.hash(password, saltForPassword)

    return hashedPassword
}

userSchema.statics.comparePassword = async function (password, userId){
    const userFromDb = await this.findById(userId)

    const isPasswordCorrect = bcrypt.compare(password, userFromDb.password)

    return isPasswordCorrect
}

module.exports = mongoose.model('User', userSchema);