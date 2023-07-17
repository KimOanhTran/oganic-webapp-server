const express = require('express');
const router = express.Router();
const chatController = require('./../../controllers/chat.controller');
const auth = require('../../middlewares/auth');
const SendMail = require('../../services/sender.service')


router.route('/list').get(auth(),chatController.List);
router.route('/new').post(auth(),chatController.New);
router.route('/add').post(auth(),chatController.AddMessage);
router.route('/get').post(auth(),chatController.GetMessages);
router.route('/mail').post((req,res,next)=>{
    try {
        SendMail.SendMail(req.body.mail,"test","test")
        return res.status(200).send({ msg: "success" })
    }
    catch(err){
        console.log(err)
        return res.status(400).send({ msg: "error" })
    }
});

module.exports = router;
