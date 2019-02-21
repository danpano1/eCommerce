const {verifyUserToken} = require('../../models/User')

module.exports = (req, res, next) =>{
    if(req.cookies.user){
       verifyUserToken(req.cookies.user, (user)=>{
           if (!user) return res.redirect('/')
            
           next();
       })
    }
    else return res.redirect('/login')
}