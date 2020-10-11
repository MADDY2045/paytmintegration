const express = require('express');
const app = express();

const port = 7000;
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/',(req,res)=>{
    res.render('HomePage')
})

app.listen(port,()=>console.log(`app is listening on ${port}`));