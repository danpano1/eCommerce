const mongoose = require('mongoose');
const Joi = require('joi');

const Schema = mongoose.Schema;

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
    isRemoved:{
        type: Boolean,
        default: false
    }

});

productSchema.statics.productValidation = (product) => {
    
    
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


productSchema.statics.findNotRemoved = async function (queryParams = {}, productsToSkip = 0, productLimit = 1){

    let notRemovedQuery = {isRemoved: false}

    notRemovedQuery = {...queryParams, ...notRemovedQuery}    

    return await this.find(notRemovedQuery).skip(productsToSkip).limit(productLimit)
}

productSchema.statics.countNotRemoved = async function (){
    
    return await this.countDocuments({isRemoved: false});

}

productSchema.statics.getRandomProducts = async function (numberOfProducts){
    
    const numberOfItemsInDb = await this.countNotRemoved();
     
    if(numberOfItemsInDb===0) return {isEmpty: true}   

    let randomProducts = [];
    
    if(numberOfProducts>numberOfItemsInDb) numberOfProducts = numberOfItemsInDb; 

    let productsToSkip = Math.floor(Math.random()*(numberOfItemsInDb - numberOfProducts + 1));   
      

    const productsFromDb = await this.findNotRemoved({} ,productsToSkip, numberOfProducts)
    
    productsFromDb.forEach( prod =>{

        randomProducts.push({
            id: prod._id,
            name: prod.name,
            price: prod.price,
            img: prod.imageURL
        })
   
    })
       

    return {
        products: randomProducts
    }  
}


productSchema.statics.getProductPagination = async function (pageNumber, prodPerPage){   
       
    let page = pageNumber || 1;
        
    if(isNaN(page)) page = 1

    page = parseInt(page)
    
    if(page<1) page = 1
        
    const numberOfProd = await this.countNotRemoved();

    if (numberOfProd===0) return {isEmpty: true}         

    const lastPage = Math.ceil((numberOfProd/prodPerPage))
    
    if(page>lastPage) page = lastPage    

    let prodsToSkip = prodPerPage*(page-1);    

    if (prodPerPage*page > numberOfProd) prodPerPage += numberOfProd - prodPerPage*page;

    const productsFromDb = await this.findNotRemoved({} ,prodsToSkip, prodPerPage)
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

module.exports = mongoose.model('Product', productSchema);