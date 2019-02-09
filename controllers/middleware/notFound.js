module.exports= (req, res) => {
    res.render('errors/404', {
        pageTitle: 'Page not found'
    })
}

