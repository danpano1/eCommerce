const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Joi = require('joi');

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
    }

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

module.exports.User = User;
module.exports.userValidation = userValidation;