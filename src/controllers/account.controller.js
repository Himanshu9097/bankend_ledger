const accountModel = require("../models/account.model");

async function createAccountController(req,res){
    const userId = req.user;

    const account = await accountModel.create({
        user:userId._id
    })

    res.status(201).json({
        account
    })
}


async function getUserAccountsController(req,res){
    const accounts = await accountModel.find({user:req.user._id})

    res.status(200).json({
        accounts
    })
}


async function getAccountsBalanceController(req,res){
    const {accountId} = req.params;

    const account = await accountModel.findOne({
        _id:accountId,
        user:req.user._id
    })

    if(!account){
        return res.status(404).json({
            message:"Account not found for the user"
        })
    }

    const balance = await account.getBalance()

    return res.status(200).json({
        accountId,
        balance 
    })
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountsBalanceController
}