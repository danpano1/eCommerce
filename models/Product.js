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
    },

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
        id: Joi.optional(),
    }
    const result = Joi.validate(product, schema, {
        abortEarly: false
    });
    return result;
}

const getRandomProducts = async (numberOfProducts) =>{
    
    const numberOfItemsInDb = await Product.countDocuments();

    let randomProducts = [];
    
    if(numberOfProducts>numberOfItemsInDb) numberOfProducts = numberOfItemsInDb; 

    let productsToSkip = Math.floor(Math.random()*(numberOfItemsInDb - numberOfProducts + 1));   
      

    const productsFromDb = await Product.find().skip(productsToSkip).limit(numberOfProducts)
    
    productsFromDb.forEach( prod =>{

        randomProducts.push({
            id: prod._id,
            name: prod.name,
            price: prod.price,
            img: prod.imageURL
        })
   
    })
       

    return randomProducts    
}

const getPagination = async (pageNumber, prodPerPage) =>{   
       
    let page = pageNumber || 1;
        
    if(isNaN(page)) page = 1

    page = parseInt(page)
    
    if(page<1) page = 1
        
    const numberOfProd = await Product.countDocuments();

    const lastPage = Math.ceil((numberOfProd/prodPerPage))

    if(page>lastPage) page = lastPage    

    let prodsToSkip = prodPerPage*(page-1);    

    if (prodPerPage*page > numberOfProd) prodPerPage += numberOfProd - prodPerPage*page;

    const productsFromDb = await Product.find().skip(prodsToSkip).limit(prodPerPage)
    const prodsToShow = [];
         

    productsFromDb.forEach(prod =>{
        
        prodsToShow.push({
            id: prod._id,
            name: prod.name,
            price: prod.price,
            img: prod.imageURL
        })

    })
    return {
        products: prodsToShow,
        lastPage: lastPage,
        currentPage: page
    }      
        
    
}


module.exports.Product = Product;
module.exports.productValidation = productValidation;
module.exports.getRandomProducts = getRandomProducts;
module.exports.getPagination = getPagination;
