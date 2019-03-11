const pdfMake = require('pdfmake');
const mongoose = require('mongoose')
const {Product} = require('../models/Product')

module.exports = async (order, res) => {
    const pdfName = `invoice-${order._id}.pdf`
    let wholeValueToPay = 0
    let prodsId = [];
    
    order.products.forEach((prod)=>{       
        prodsId.push(mongoose.Types.ObjectId(prod.productId))
    })

    const productsFromDb = await Product.find({
        _id:{
            $in: prodsId
        }
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename=${pdfName}`)

    var fonts = {
        Courier: {
            normal: 'Courier',
            bold: 'Courier-Bold',
            italics: 'Courier-Oblique',
            bolditalics: 'Courier-BoldOblique'
          }
      };

    const printer = new pdfMake(fonts)

    var docDefinition = {
        content: [
            { text: 'Invoice', style: 'mainHeader' },
            {
            columns: [
              {
                style: 'headColumn',
                text: `Product`                
              },
              {
                style: 'headColumn',
                text: `Quantity`                
              },
              {
                style: 'headColumn',
                text: `Price of products`,
              },              
            ],          
          }],
          defaultStyle: {
            font: 'Courier',            
          },
          styles: {
            dataColumn: {
                width: '33%',
                alignment: 'center',
                margin: [0, 5]
            },
            headColumn:{
                width: '33%',
                bold: true,
                alignment: 'center',
                margin: [0, 5]
            },
            mainHeader:{
                fontSize: 22, 
                bold: true, 
                alignment: 'center',
                margin: [0, 0, 0, 35] 
            },
            secondaryHeader:{
                fontSize: 18, 
                bold: true, 
                alignment: 'center',
                margin: [0, 15] 
            },
            dataHeader:{
                bold: true,
                alignment: 'center',
                margin: [0, 3]
            },
            data:{
                alignment: 'center',
                margin: [0, 3]
            }
        }
      };  
      

   
    for(let i = 0; i<productsFromDb.length; i++){
        
        const productsValue = order.products[i].productQuantity * productsFromDb[i].price
        wholeValueToPay += productsValue

        docDefinition.content.push({
            columns: [
              {
                style: 'dataColumn',
                text: `${productsFromDb[i].name}`
              },
              {
                style: 'dataColumn',
                text: `${order.products[i].productQuantity}`
              },
              {
                style: 'dataColumn',
                text: `${productsValue}`
              },              
            ],          
          })      
    }

    docDefinition.content.push(
        {
            columns: [
            {
                text: '',              
                width: '33%',              
            },
            {  
                text: '',            
                width: '33%',
            },
            {              
                style: 'headColumn',
                text: 'Full sum'
            }
        ],
    },
    {
        columns: [
        {   
            text: '',            
            width: '33%',              
        },
        {   
            text: '',            
            width: '33%',
        },
        {
            style: 'dataColumn',           
            text: `${wholeValueToPay}`            
        }
    ],
    },
    {
        style: 'secondaryHeader',
        text: 'Shipping data'
    },
    {
        style:'dataHeader',
        text: 'Full name'
    },
    {
        style:'data',
        text: `${order.name} ${order.surname}`
    },
    {
        style:'dataHeader',
        text: 'E-mail'
    },
    {
        style:'data',
        text: `${order.email}`
    },
    {
        style:'dataHeader',
        text: 'Shipping adress'
    },
    {
        style:'data',
        text: `${order.postCode}, ${order.city}`
    },
    {
        style:'data',
        text: `${order.streetAdress}, ${order.country}`
    },
    )

    const invoicePdf = printer.createPdfKitDocument(docDefinition);

    invoicePdf.pipe(res)
    invoicePdf.end();
}