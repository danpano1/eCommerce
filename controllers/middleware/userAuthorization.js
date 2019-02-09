const {verifyUserToken} = require('../../models/User')

module.exports = (req, res, next) =>{
    if(req.cookies.user){
       verifyUserToken(req.cookies.user, (user)=>{
           if (!user) return res.status(401).send('Bad token')
            
           next();
       })
    }
    else return res.status(403).send('No token')
}