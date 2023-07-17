const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const config = require('../config/config')
const Account = require('../models/account.model');
const Chat = require('../models/chat.model');
const NodeCache = require('node-cache');
const codeCache = new NodeCache();
const {
  Types: { ObjectId: ObjectId },
} = require("mongoose");

const New = async (req, res, next) => {
    try {
        const message = req.body.message;
        const account= req.user;
        if (!message)
            return res.status(400).send({ msg: config.message.err400 })

        // Remove old Chatbox
        if (account.chats.length > 0) {
            Chat.findByIdAndDelete(account.chats.pop()).exec((err, doc) => {
                if (doc) {
                    // console.log("???")
                    Account.findByIdAndUpdate(doc.saler, { $pull: { chats: doc._id } }).exec();
                }
            })
        }
        // Get list of saler
        const salers = await Account.find({ role: 'Sale' })
        if (salers.length == 0)
            return res.status(400).send({ msg: config.message.errOutOfSaler })
        const minChatSaler = salers.reduce((prev, current) => (prev.chats.length > current.chats.length) ? prev : current)

        const chat = new Chat({
            customer: account._id,
            saler: minChatSaler._id,
            messages: [{
                isCustomer: true,
                message: message
            }]
        })

        chat.save((err, doc) => {
            if (err) return res.status(500).send({ msg: config.message.err500 })
            account.chats.push(doc._id)
            account.save()
            minChatSaler.chats.push(doc._id)
            minChatSaler.save()
            return res.send({ msg: config.message.success, data: doc._id })
        })
    } catch (err) {
        console.log(err)
        return res.status(400).send({ msg: config.message.err400 })
    }
}

const List = async (req, res, next) => {
    try {
        const account = req.user
        var pipeline = []
        if (account.role == "Customer") {
            pipeline.push({ $match: { customer: account._id } })
            pipeline.push({
                $lookup: {
                    from: "accounts",
                    localField: "saler",
                    foreignField: "_id",
                    pipeline: [
                        { $project: { name: 1, email: 1, phone: 1 } }
                    ],
                    as: "saler"
                }
            })
            pipeline.push({
                $project: {
                    _id: 1,
                    saler: { $arrayElemAt: ["$saler", -1] },
                    last_message: { $arrayElemAt: ["$messages", 0] },
                    seen: 1
                }
            })
        }
        else {
            pipeline.push({ $match: { saler: account._id } })
            pipeline.push({
                $lookup: {
                    from: "accounts",
                    localField: "customer",
                    foreignField: "_id",
                    pipeline: [
                        { $project: { name: 1, email: 1, phone: 1 } }
                    ],
                    as: "customer"
                }
            })
            pipeline.push({
                $project: {
                    _id: 1,
                    customer: { $arrayElemAt: ["$customer", -1] },
                    last_message: { $arrayElemAt: ["$messages", 0] },
                    seen: 1
                }
            })
        }
        Chat.aggregate(pipeline).exec((err, docs) => {
            if (err) return res.status(500).send({ msg: config.message.errInternal })
            return res.send({ msg: config.message.success, data: docs })
        })

    } catch (err) {
        console.log(err)
        return res.status(500).send({ msg: config.message.errInternal })
    }
}

const AddMessage = async (req, res, next) => {
    try {
        const account = req.user;
        const _id = req.body._id;
        const message = req.body.message
        var find_options;
        var update_options;

        if (account.role == "Sale") {
            find_options = { _id, saler: account._id }
            update_options = { seen: false, $push: { "messages": { $each: [{ isCustomer: false, message: message }], $position: 0 } } }
        }
        else {
            find_options = { _id, customer: account._id }
            update_options = { seen: false, $push: { "messages": { $each: [{ isCustomer: true, message: message }], $position: 0 } } }
        }

        Chat.findOneAndUpdate(find_options, update_options).exec((err, doc) => {
            if (err) return res.status(500).send({ msg: config.message.err500 })
            if (!doc) return res.status(400).send({ msg: config.message.err400 })
            return res.send({ msg: config.message.success })
        })
    } catch (err) {
        console.log(err)
        return res.status(400).send({ msg: config.message.err400 })
    }
}

const GetMessages = async (req, res, next) => {
    try {
        const account= req.user;
        const _id = req.body._id;
        const skip = Number(req.body.skip) || 0;
        const limit = Number(req.body.limit) || 20;
        // @ts-ignore
        console.log("id",_id)
        if (!account.chats.includes(_id)) return res.status(400).send({ msg: config.message.errPermission + "[_id]. " })

        if (account.role == "Customer")
            Chat.findById(_id).slice("messages", [skip, limit]).populate('saler', "name email phone").exec((err, doc) => {
                console.log("1")
                if (err) return res.status(500).send({ msg: config.message.err500 })
                console.log("2")
                if (!doc) return res.status(400).send({ msg: config.message.errPermission })
                if (skip == 0 && doc.messages[0].isCustomer == false) {
                    doc.seen = true
                    doc.save()
                }
                res.send({ msg: config.message.success, data: doc})
            })
        else
            Chat.findById(_id).slice("messages", [skip, limit]).populate('customer', "name email phone").exec((err, doc) => {
                if (err) return res.status(500).send({ msg: config.message.err500 })
                if (!doc) return res.status(400).send({ msg: config.message.errPermission })
                if (skip == 0 && doc.messages[0].isCustomer == true) {
                    doc.seen = true
                    doc.save()
                }
                res.send({ msg: config.message.success, data: doc})
            })
    } catch (err) {
        console.log(err)
        return res.status(400).send({ msg: config.message.err400 })
    }
}

module.exports = {
    New,
    List,
    AddMessage,
    GetMessages
};
