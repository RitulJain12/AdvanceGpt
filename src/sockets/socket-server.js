const { Server } = require('socket.io');
const cookie=require('cookie');
const jwt=require('jsonwebtoken');
const userModel=require('../models/user');
const {GenerateVector,GenerateResponse}=require('../services/ai-service');
const MessageModel=require('../models/message');
const { chat } = require('@pinecone-database/pinecone/dist/assistant/data/chat');
function initSocketServer(httpserver){
 const io=new Server(httpserver,{
   cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST","PUT","PATCH","DELETE"],
      credentials: true
    }
 })
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
       console.log(user._id);
         next();
      }
      catch(err){
          next(new Error(err));
      }

 })

 io.on('connection',(socket)=>{
      console.log("aya");
     socket.on("ai-message",async (msg)=>{
        const vectors= await GenerateVector(msg.message);
            
        const UserMsg= await MessageModel.create({
            chat:msg.chatId,
            user:socket.user._id,
            content:msg.message,
           
         })
         const Memory=await queryMemory({
            queryVector:vectors,
            limit:20,
            metadata:{user:socket.user._id}
           })
         await createMemory({
            vectors,
            msgId:UserMsg._id,
            metadata:{
               chat:msg.chatId,
               user:socket.user._id,
               msg:msg.message,
               role:"user"
            }
           })
         
         
         const ChatHistory= (await MessageModel.find({chat:msg.chatId}).sort({createdAt:-1}).limit(5).lean()).reverse();

         const ShortMemory=ChatHistory.map(item=>{
            return{
                role:item.role,
                parts:[{text:item.content}]
            }

         })
         console.log(Memory);
      
          const ltm=[
            {
               role:"user",
               parts: [{ text: `
                  
                  these are some previous messages for the chat,use them to generate a response
                  ${Memory.map(item=>item.metadata.msg).join("\n")}

                  ` }]
            }
          ]

          console.log(...ltm)
        const response=await GenerateResponse([...ltm,...ShortMemory]);
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
               msg:response,
   
            }
           })
         socket.emit("ai-message-response",{response:response,
            chatId:msg.chatId});
     })
 })
}

module.exports=initSocketServer;