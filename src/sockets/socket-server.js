const { Server } = require('socket.io');
const cookie=require('cookie');
const jwt=require('jsonwebtoken');
const userModel=require('../models/user');
const {GenerateVector,GenerateResponse}=require('../services/ai-service');
const MessageModel=require('../models/message');
const { chat } = require('@pinecone-database/pinecone/dist/assistant/data/chat');
function initSocketServer(httpserver){
 const io=new Server(httpserver,{})
    const{createMemory,queryMemory}=require('../services/vectordb')
 io.use(async(socket,next)=>{
      const cookies=cookie.parse(socket.handshake.headers?.cookie||"");
      if(!cookies.token){
          next(new Error("Unauthorized"));
      }
      try{
        const decoded=jwt.verify(cookies.token,process.env.KEY);
         const user=await userModel.findById(decoded.id);
         socket.user=user;
       
         next();
      }
      catch(err){
          next(new Error(err));
      }

 })

 io.on('connection',(socket)=>{
     
     socket.on("ai-message",async (msg)=>{
        const vectors= await GenerateVector(msg.message);
    
        const UserMsg= await MessageModel.create({
            chat:msg.chatId,
            user:socket.user._id,
            content:msg.message,
            role:'user'
         })
         await createMemory({
            vectors,
            msgId:UserMsg._id,
            metadata:{
               chat:msg.chatId,
               user:socket.user._id,
               msg:msg.message
            }
           })
           const Memory=await queryMemory({
            queryVector:vectors,
            limit:3,
            metadata:{}
           })
           console.log(Memory);
         const ChatHistory= (await MessageModel.find({chat:msg.chatId}).sort({createdAt:-1}).limit(5).lean()).reverse();
         const ShortMemory=ChatHistory.map(item=>{
            return{
                role:item.role,
                parts:[{text:item.content}]
            }

         })
        
      
        const response=await GenerateResponse(ShortMemory);
      const Modelmsg=   await MessageModel.create({
            chat:msg.chatId,
            user:socket.user._id,
            content:response,
            role:'model'
         })
         const ResponseVectors= await GenerateVector(response);
       
         await createMemory({
            vectors: ResponseVectors,
            msgId:Modelmsg._id,
            metadata:{
               chat:msg.chatId,
               user:socket.user._id,
               msg:response
            }
           })
         socket.emit("ai-message-response",{response:response,
            chatId:msg.chatId});
     })
 })
}

module.exports=initSocketServer;