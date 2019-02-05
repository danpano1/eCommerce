const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();

const shopRoute = require('./routes/shop');
const adminRoute = require('./routes/admin');

app.set('view engine', 'pug');

app.use(express.json());
app.use(cookieParser('secret'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


app.use('/', shopRoute);
app.use('/admin', adminRoute);


app.use((req, res)=>{
    res.render('404', {
        pageTitle: 'Product not found'
    })
})
const port = process.env.PORT || 8080

app.listen(port, ()=>{
    console.log(`Listening on port ${port}`)
})

mongoose.connect('mongodb://localhost:27017/eCommerce', {useNewUrlParser: true}, ()=>{
    console.log('Connected to the DB');
});
