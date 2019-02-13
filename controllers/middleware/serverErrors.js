module.exports = (err, req, res, next) =>{
    console.log(err);
    if (err.code === 'EBADCSRFTOKEN') res.status(403).send('Form tampered')
    else res.status(500).render('errors/serverError')
}