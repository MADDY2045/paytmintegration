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
    //console.log(req.body);
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
            //console.log(response.data);
            serverSideResponseHandler('qeKSkx70337520159677',orderid,'xpMcuxkn2uDmuglL');
           if(response.data.body.resultInfo.resultStatus === 'S'){
                let data = {
                    mid:'qeKSkx70337520159677',
                    orderid:orderid,
                    txnToken:response.data.body.txnToken
                }
                res.render('Paymentcheckout',{data});
                //res.send({message:"Success",data:{amount:req.body.amount,name:req.body.name,orderid:orderid}});
            }else{
                res.send({message:"failure",reason:response.data.body.resultInfo.resultMsg})
            }
        })
        .catch(err=>console.log(`error in fetching token ${err}`));
        });

})

app.post('/callback',(req,res)=>{
    //console.log(`callback response is ${JSON.stringify(req.body,null,2)}`);
    console.log(`client side response hash :${req.body.CHECKSUMHASH}`);
    var body = {mid:req.body.MID,orderId:req.body.ORDERID};
    var paytmChecksum = req.body.CHECKSUMHASH;
    console.log(`checksum hash : ${paytmChecksum}`);
    delete req.body.CHECKSUMHASH;
    var isVerifySignature = Paytm.verifySignature(req.body, 'xpMcuxkn2uDmuglL', paytmChecksum);
    console.log(`isverifysignature : ${isVerifySignature}`);
    if (isVerifySignature) {
        console.log("Checksum Matched");
        res.send(req.body);
    } else {
	console.log("Checksum Mismatched");
    }
    serverSideResponseHandler(req.body.MID,req.body.ORDERID,'xpMcuxkn2uDmuglL');
   })


function serverSideResponseHandler(mid,orderid,mkey){
    var paytmParams = {};
    paytmParams.body = {
        /* Find your MID in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys */
        "mid" : mid,
        /* Enter your order id which needs to be check status for */
        "orderId" : orderid
    };
    Paytm.generateSignature(JSON.stringify(paytmParams.body), mkey).then(function(checksum){
        /* head parameters */
        paytmParams.head = {
            "signature"	: checksum
        };
        //console.log(`server side request hash: ${checksum}`);

       var post_data = JSON.stringify(paytmParams);

        var options = {
            url: 'https://securegw-stage.paytm.in/v3/order/status',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length
            },
            data:paytmParams
        };

         axios(options)
        .then(response=>{
            console.log(`Server side response .......${JSON.stringify(response.data,null,2)}`);
            //console.log(`server side response hash: ${}`)
           })
            .catch(err=>console.log(`error in fetching token ${err}`));
        });

    }

app.listen(port,()=>console.log(`app is listening on ${port}`));