const express = require('express');
const shortid = require('shortid');
const app = express();
const https = require('https')
const axios = require('axios');

const Paytm = require('paytmchecksum');

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

const port = 7000;
app.use(express.static('public'));

app.set('view engine', 'ejs');

app.get('/',(req,res)=>{
    res.render('HomePage')
});

app.post('/createorder',(req,res)=>{
    console.log(req.body);
    let orderid = shortid.generate();
    var paytmParams = {};
    paytmParams.body = {
        "requestType"   : "Payment",
        "mid"           : "qeKSkx70337520159677",
        "websiteName"   : "WEBSTAGING",
        "orderId"       : `${orderid}`,
        "callbackUrl"   : "http://localhost:7000/callback",
        "txnAmount"     : {
            "value"     : `${req.body.amount}`,
            "currency"  : "INR",
        },
        "userInfo"      : {
            "custId"    : `${req.body.name}`,
        },
    };
    Paytm.generateSignature(JSON.stringify(paytmParams.body), "xpMcuxkn2uDmuglL").then(function(checksum){

            paytmParams.head = {
                "signature"    : checksum
            };

            var post_data = JSON.stringify(paytmParams);

            var options = {
                url: `https://securegw-stage.paytm.in/theia/api/v1/initiateTransaction?mid=qeKSkx70337520159677&orderId=${orderid}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': post_data.length
                },
                data:paytmParams
            };

           axios(options).then(response=>{
            console.log(response.data);
            if(response.data.body.resultInfo.resultStatus === 'S'){
                res.send({message:"Success",data:{amount:req.body.amount,name:req.body.name,orderid:orderid}});
            }else{
                res.send({message:"failure",reason:response.data.body.resultInfo.resultMsg})
            }
        })
        .catch(err=>console.log(`error in fetching token ${err}`));
        });

})

app.listen(port,()=>console.log(`app is listening on ${port}`));