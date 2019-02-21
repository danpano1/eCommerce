const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const csurf = require('csurf')

const shopRoutes = require('./controllers/routes/shop');
const adminRoutes = require('./controllers/routes/admin');
const authRoutes = require('./controllers/routes/auth');
const userRoutes = require('./controllers/routes/user');


const notFound = require('./controllers/middleware/notFound');
const locals = require('./controllers/middleware/locals');
const userAuthorization = require('./controllers/middleware/userAuthorization')
const serverError = require('./controllers/middleware/serverErrors')

const app = express();

app.set('view engine', 'pug');

app.use(express.json());
app.use(cookieParser('secret'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


app.use(csurf({cookie: true}));
app.use(locals);

app.use('/', shopRoutes, authRoutes);
app.use('/', userAuthorization, userRoutes);
app.use('/admin', adminRoutes);

app.use(serverError);
app.use(notFound);

const port = process.env.PORT || 8080

app.listen(port, ()=>{
    console.log(`Listening on port ${port}`)
})

mongoose.connect('mongodb://localhost:27017/eCommerce', {useNewUrlParser: true}, ()=>{
    console.log('Connected to the DB');
});
