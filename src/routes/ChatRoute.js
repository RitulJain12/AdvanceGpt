const express=require('express');
const router=express.Router();
const {authUser}=require('../middlewares/auth-middleware');
const {createChat,Deltchat,updateTitle,getAllChats}=require('../controllers/chat_controller');
router.get('/',authUser,getAllChats)
router.post('/create',authUser,createChat);
router.delete('/:id',authUser,Deltchat);
router.put('/:id',authUser,updateTitle)

module.exports=router;