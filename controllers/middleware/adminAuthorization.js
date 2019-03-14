const {verifyUserToken} = require('../../models/User')

module.exports = (req, res, next) =>{
    if(req.cookies.user){
       verifyUserToken(req.cookies.user, (user)=>{
            if (!user) return res.redirect('/')
            if (!user.isAdmin) return res.redirect('/')

            res.locals.isAdmin = true;            
            res.locals.user = user;    
                    
            next();
       })
    }
    else return res.redirect('/login')
}