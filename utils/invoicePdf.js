const pdfMake = require('pdfmake');

module.exports = async (order, res) => {
    const pdfName = `invoice-${order.id}.pdf`
   

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
      

   
    order.products.forEach(prod => {
        
        docDefinition.content.push({
            columns: [
              {
                style: 'dataColumn',
                text: `${prod.name}`
              },
              {
                style: 'dataColumn',
                text: `${prod.quantity}`
              },
              {
                style: 'dataColumn',
                text: `${prod.price*prod.quantity}$`
              },              
            ],          
          })     

    })      
    

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
            text: `${order.wholePrice}$`            
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