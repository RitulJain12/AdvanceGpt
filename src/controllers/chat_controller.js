const chatModel=require('../models/chat-model');
const MessageModel=require('../models/message');
async function createChat(req,res) {
    
    const {title}=req.body;
    const {user}=req;
   console.log("chat created");
    const chat=await chatModel.create({
        user:user._id,
        title
    });
    res.status(201).json({
        message:"Chat Created Successfully",
        chat:{
            id:chat._id,
            title:chat.title,
            lastActivity:chat.lastActivity
        }
    });
}


async function Deltchat(req,res) {
    
    const {id}=req.params;
   
   try{
    const chat=await chatModel.findByIdAndDelete(id);
    console.log(chat);
    
    res.status(200).json({
        message:"Chat Deleted Successfully",
       
    });
}
catch(err){
    res.status(404).json({
        message:"Error in chat deletion"
    })
}
}
async function updateTitle(req,res) {
    const { id } = req.params;

    const chat = await chatModel.findByIdAndUpdate(
      id,
      { title: req.body.title },
      { new: true } 
    );
    
    if (!chat) {
      return res.status(404).json({
        message: "Error in title updation"
      });
    }
    console.log(chat);
    res.status(200).json({
      message: "Title updated Successfully",
      chat
    });
    
}






async function getAllChats(req,res) {
    
    const chatList = await chatModel.find(
      {user:req.user._id}
    );
    
    if (!chatList) {
      return res.status(404).json({
        message: "Error in Finding chats"
      });
    }
    const chats= [];


    for (let cht of chatList) {
      const msgs = await MessageModel.find({ chat: cht._id }).select("-user -chat");
    
      chats.push({
        ...cht.toObject(),  // IMPORTANT
        messages: msgs
      });
    }
    
    console.log(chats);
    res.status(200).json({
      message: "Chats Fetched Successfully",
      chats
    });
    
}








module.exports={
    createChat,
    Deltchat,updateTitle,getAllChats
}