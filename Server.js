const app=require('../Backend/src/app');
require('dotenv').config();
const ConnectDB=require('./src/db/db');
  ConnectDB().then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log("Connected");
      });
  }).catch(err=>console.log(err));
