module.exports = (req, res, next)=>{
    res.locals.amountOfCartItems = 0;
    res.locals.isLoggedIn = false;

    if(req.signedCookies.cart){
        const itemsInCart = req.signedCookies.cart.items
        res.locals.amountOfCartItems = 0;
        itemsInCart.forEach((item)=>{
            res.locals.amountOfCartItems+=item.quantity
        })
    } 
    if(req.cookies.user) res.locals.isLoggedIn = true

    next();
    
}