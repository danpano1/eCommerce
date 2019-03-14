module.exports = (req, res, next)=>{
    res.locals.amountOfCartItems = 0;
    res.locals.isLoggedIn = false; 
    res.locals.isAdmin = false;
    res.locals.csrfToken = req.csrfToken();

    if(req.signedCookies.cart){
        const itemsInCart = req.signedCookies.cart.items
        itemsInCart.forEach((item)=>{
            res.locals.amountOfCartItems+=item.quantity
        })
    } 
    if(req.cookies.user) res.locals.isLoggedIn = true

    next();
    
}