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
    console.log(`body response is ${JSON.stringify(req.body,null,2)}`);
    //const orderid = shortid.generate();
    var paytmParams = {};
    paytmParams.body = {
        "requestType"   : "Payment",
        "mid"           : "qeKSkx70337520159677",
        "websiteName"   : "WEBSTAGING",
        "orderId"       : `${req.body.orderid}`,
        "callbackUrl"   : "http://localhost:7000/callback",
        "txnAmount"     : {
            "value"     : `${req.body.amount}`,
            "currency"  : "INR",
        },
        "userInfo"      : {
            "custId"    : `${req.body.name}`,
            "mobile":"9894948839",
            "email":"madhavaneee08@gmail.com"
        }
    };
    Paytm.generateSignature(JSON.stringify(paytmParams.body), "xpMcuxkn2uDmuglL").then(function(checksum){

            paytmParams.head = {signature: checksum};
            var post_data = JSON.stringify(paytmParams);
            var options = {
                url: `https://securegw-stage.paytm.in/theia/api/v1/initiateTransaction?mid=qeKSkx70337520159677&orderId=${req.body.orderid}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': post_data.length
                },
                data:paytmParams
            };

           axios(options)
            .then(response=>{
                //serverSideResponseHandler('qeKSkx70337520159677',orderid,'xpMcuxkn2uDmuglL');
                console.log(`response data is ${JSON.stringify(response.data,null,2)}`);
                    if(response.data.body.resultInfo.resultStatus === 'S'){
                        let data = {
                            mid:'qeKSkx70337520159677',
                            orderid: paytmParams.body.orderId,
                            txnToken:response.data.body.txnToken,
                            amount:req.body.amount,
                            customername:req.body.name
                        }
                        res.render('Paymentcheckout',{data});
                    }else{
                    res.send({message:"failure",reason:response.data.body.resultInfo.resultMsg})
                }
            })
            .catch(err=>console.log(`error in fetching token ${err}`));
        });

})

app.post('/callback',(req,res)=>{
    console.log(`call back url response is ${JSON.stringify(req.body,null,2)}`);
    var paytmChecksum = req.body.CHECKSUMHASH;
    delete req.body.CHECKSUMHASH;
    var isVerifySignature = Paytm.verifySignature(req.body, 'xpMcuxkn2uDmuglL', paytmChecksum);

    if (isVerifySignature) {
        serverSideResponseHandler(req.body.MID,req.body.ORDERID,'xpMcuxkn2uDmuglL');
        res.send(req.body);
        } else {
        res.send("Checksum Mismatch_Something has gone wrong");
    }
});


function serverSideResponseHandler(mid,orderid,mkey){
    var paytmParams = {};
    paytmParams.body = {
        mid : mid,
       orderId: orderid
    };

    Paytm.generateSignature(JSON.stringify(paytmParams.body), mkey).then(async function(checksum){

        paytmParams.head = {signature:checksum};
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
                console.log(`s2s response ${JSON.stringify(response.data,null,2)}`);
                if(response.data.body.resultInfo.resultStatus === 'TXN_SUCCESS'){
                    console.log("Transaction is successful!!");
                }else{
                    console.log(`transaction failed_${response.data.body.resultInfo.resultMsg}`);
                }
            })
            .catch(err=>{
                console.log(`error in fetching token ${err}`);
                return 'failure'
            });
        });

    }

app.listen(port,()=>console.log(`app is listening on ${port}`));