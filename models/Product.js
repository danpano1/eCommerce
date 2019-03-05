const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Joi = require('joi');

const productSchema = new Schema ({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    imageURL: {
        type: String,
        required: true,
        match: /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/
    },
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    }

});
const Product = mongoose.model('Product', productSchema);

const productValidation = (product) => {
    
    
    const schema = {
        name: Joi.string().min(5).trim().required(),
        price: Joi.number().required(),
        imageURL: Joi.string().
                    trim().
                    regex(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/).                    
                    required().
                    error((errs)=> {
                        return errs.map(err => {
                            if (err.type === 'string.regex.base')
                                return {message : '"image URL" must be a proper URL'}
                            else
                                return {message : '"image URL" is reqruired and must be a string'};
                        });
                    }),

        description: Joi.string().trim().min(10).required(),
        quantity: Joi.number().required(),
        _csrf: Joi.required(),
    }
    const result = Joi.validate(product, schema, {
        abortEarly: false
    });
    return result;
}

const getRandomProducts = async (numberOfProducts) =>{
    const count = await Product.countDocuments();
    let allRandomProducts = [];
    let randomNumbers = [];
    
    if(numberOfProducts>count) numberOfProducts = count;
    
    for(let i = 0; i<numberOfProducts; i++){
        let random = 0;

        do random = Math.floor(Math.random()*count)+1;
        while (randomNumbers.find(n => n === random))
        
        randomNumbers.push(random);

        const randomProduct = await Product.findOne().skip(--random);

        allRandomProducts.push({
            id: randomProduct._id,
            name: randomProduct.name,
            price: randomProduct.price,
            img: randomProduct.imageURL
        })
    }

    return allRandomProducts    
}


module.exports.Product = Product;
module.exports.productValidation = productValidation;
module.exports.getRandomProducts = getRandomProducts;
