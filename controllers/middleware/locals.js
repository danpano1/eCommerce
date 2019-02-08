module.exports = (req, res, next)=>{
    if(req.signedCookies.cart){
        const itemsInCart = req.signedCookies.cart.items.length
        res.locals.amountOfCartItems = itemsInCart;
        next();
    } else{
        res.locals.amountOfCartItems = 0;
        next();
    }
    
}