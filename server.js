const express =require("express");
const helmet=require('helmet');
var bodyParser = require('body-parser')
const paymentsdk = require('api')('@cashfreedocs-new/v1#5232kkwyp8vyl');
paymentsdk.server('https://sandbox.cashfree.com/pg');
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require('./howla-games-firebase-adminsdk-svr6c-bf317317ae.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();



const app=express();
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(helmet());



app.get("/",function(req,res){



res.status(200).send({
    "status":"ok"
});

    
});





app.post("/recivedpayment",async function(req,res){


    console.log("order recived at order "+req.query.orderid);

    result =await db.collection("paymentslips").doc(req.query.orderid).get();
    console.log(result)
    if(result._createTime==undefined){


    paymentsdk.GetOrder({
        order_id: req.query.orderid,
        'x-client-id': '125387014252ac8d3da353ceea783521',
        'x-client-secret': '65bbddb20cf3e741c95f9835c5b379f75d504a6b',
        'x-api-version': '2021-05-21'
      })
        .then(async function(get_res)  {

            
            if(get_res.order_status=='PAID'&&get_res.order_currency=="INR"){
        
        
        
        
        
        
        
                let res2=await db.collection('user').doc(get_res.customer_details.customer_id).get();
            
                console.log(res2)
                db.collection("user").doc(get_res.customer_details.customer_id).update({
                
                
                    balance:res2.data()["balance"]+get_res.order_amount
                }).then(()=>{
                db.collection("paymentslips").doc(req.query.orderid).set({
                
                
                    "used":true
                });
                    res.send({
                        balance:res2.data()["balance"]+get_res.order_amount
                    });
                })
            
            
            
            
            
            
            
            
            
            
            
            }
            else{
            
            
            
            
            
                console.log("payment failed ")
            
                res.send({
                    "status":"failed"
                });
            
            
            
            
            
            
            
            }

            
            

        })
        .catch(err => {
            res.status(200).send({
                "status":"bad",
                "res":err
            });
            
        });
   
////....

       
        
        }

    ///.......
    else{
        console.log("payment alreay added please contact our customer care support")

 res.status(200).send({
     "status":"payment alreay added please contact our customer care support"
 })

    }



})
app.post("/rechargewallet",async function(req,res){
console.log(req.body)




    result =await db.collection("paymentslips").doc(req.body.payslip).get();


if(result._createTime==undefined){
   


paymentsdk.GetPaymentbyId({
    order_id: req.body.payslip,
    cf_payment_id: req.body.payment_id,
    'x-client-id': '125387014252ac8d3da353ceea783521',
    'x-client-secret': '65bbddb20cf3e741c95f9835c5b379f75d504a6b',
    'x-api-version': '2021-05-21'
  })
    .then ( async function(pay_res) {

/// check the payment amount and add to console
if(pay_res.payment_status=='SUCCESS'&&pay_res.payment_currency=="INR"){







    let res2=await db.collection('user').doc(req.body.uid).get();

    console.log(res2)
    db.collection("user").doc(req.body.uid).update({
    
    
        balance:res2.data()["balance"]+pay_res.payment_amount
    }).then(()=>{
    db.collection("paymentslips").doc(req.body.payslip).set({
    
    
        "used":true
    });
        res.send({
            balance:res2.data()["balance"]+pay_res.payment_amount
        });
    })











}
else{





    console.log("payment failed ")

    res.send("payment failed ");







}
////

        


    })
    .catch(err => {



res.send("failed to read payment status from our servers plealse consult oue customer care service ")



//// error while reding payment





    });




}
else{
/// payment already registered




console.log("payment alreay added please contact our customer care support")

 res.status(200).send("payment alreay added please contact our customer care support")
}


console.log(result._createTime);



})

app.post("/createorder",async function(req,res){




 

    ///// try .............
var userdata=await db.collection("user").doc(req.body.uid).get();
var userdata_data=userdata.data();
console.log(userdata.data())
var customer_mobileno= userdata_data.mobile_number,
 orderid=customer_mobileno+new Date().getTime();
var customer_email;
if(userdata_data.email==undefined){
    customer_email="gunreddyvishnu@gmail.com"
}
else{
    customer_email=userdata_data.email;
}
var orderamount=req.body.orderamount;


console.log("customer details ............................");
console.log(customer_mobileno);
console.log(customer_email);
console.log(orderid);


////.................................... 
paymentsdk.CreateOrder({
    customer_details: {
      customer_id: req.body.uid,
      customer_email: customer_email,
      customer_phone: customer_mobileno,
    },
    order_meta: {
      notify_url: 'http://60.243.219.21:3000/recivedpayment?orderid='+orderid,
      payment_methods: 'upi'
    },
    // order_tags: {
    //   newKey: '',
    //   'newKey-1': 'New Value',
    //   'newKey-2': 'New Value'
    // },
    order_currency: 'INR',
    order_amount:orderamount ,
    order_id: orderid,
    order_note: 'howla games wallet recharge of rs '+orderamount+'on '+new Date()
  }, {
    'x-client-id': '125387014252ac8d3da353ceea783521',
    'x-client-secret': '65bbddb20cf3e741c95f9835c5b379f75d504a6b',
    'x-api-version': '2021-05-21'
  })
    .then(__order => {
        console.log("order created !!!!");
    

res.status(200).send({

"order_token":__order.order_token,
"status":"good",
"version":'2021-05-21',

})

    })
    .catch(err => res.status(405).send({
        "error":err,
        "status":"bad"
    }));


///////////////////  catch

// catch(__ex){
//     console.log("error while creating ");
//     res.status(200).send({
//         "status":"bad",
//         "result":__ex
//     })


// }









/// end

})


app.post("/creategame",async function(req,res){

    var userid=req.body.uid;
var phonenumber=req.body.mobilenumber;





 var userdata= await db.collection("user").doc(userid).get();

var tempuserdata=userdata.data();

   
        
if(tempuserdata==undefined){
   
    res.status(404).send({
        "status":"bad",
        "error":"auth_fail"
        
        
        
        
            })
            /// hacker
}
else{
    if(tempuserdata.mobile_number==phonenumber){
   
     if(tempuserdata.balance>=req.body.stack){
        db.collection("games").add({
            "host_uid":userid,
            "host_dp":tempuserdata.dp,
            "host_name":tempuserdata.name,
            "host_xxxx":tempuserdata.___xxxx,
            "stack_amount":req.body.stack,
            "status":"created"
            
            }).then(function(rrr){
                
            db.collection('user').doc(userid).update({
                "balance":tempuserdata.balance-req.body.stack
            }).then(function(){
            
                res.send({
                    "status":"good",
                    "error":"room_created"
                })
            }).catch(function(exxxxx){
                /// after transcation fail
                res.status(404).send({
                    "status":"bad",
            "error":"unable_342"
                })
            
            
            });
            
            }).catch(function(exxx){
                res.status(404).send({
                    "status":"bad",
            "error":"unable_342"
                })
            })
            
     }
     else{
        res.status(404).send({
            "status":"bad",
            "error":"insufficient_bal",
            "a_balance":tempuserdata.balance,
            
            
            
            
                })

     } 
        
        
        
        }
        else{
        
            // authentication failed;
            res.status(404).send({
        "status":"bad",
        "error":"auth_fail"
        
        
        
        
            })
        }
    

}
///;;;;;;;;






})

app.listen(3000,()=>{
    console.log('app is listing on port 3000');
})