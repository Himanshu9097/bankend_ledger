const transactionModel = require("../models/transcation.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");


async function createTransaction(req,res){

    /**
     * validate request
     */

    const {fromAccount,toAccount,amount,idempotencyKey} = req.body;

    if(!fromAccount || !toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"fromAccount, toAccount, amount and idempotencyKey are required"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id:fromAccount,
    })

    const toUserAccount = await accountModel.findOne({
        _id:toAccount,
    })

    if(!fromUserAccount || !toUserAccount){
        return res.status(404).json({
            message:"fromAccount or toAccount not found"
        })
    }
    
    /**
     * Validate idempotency key
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if(isTransactionAlreadyExists){
        if(isTransactionAlreadyExists.status === "SUCCESS"){
            return res.status(200).json({
                message:"Transaction already completed",
                transaction: isTransactionAlreadyExists
            })
        }

        if(isTransactionAlreadyExists.status === "PENDING"){
            return res.status(200).json({
                message:"Transaction is pending",
                transaction: isTransactionAlreadyExists
            })
        }

        if(isTransactionAlreadyExists.status === "FAILED"){
            return res.status(400).json({
                message:"Transaction failed, please try again",
                transaction: isTransactionAlreadyExists
            })
        }

        if(isTransactionAlreadyExists.status === "REVERSED"){
            return res.status(400).json({
                message:"Transaction is reversed",
                transaction: isTransactionAlreadyExists
            })
        }

    }

    /**
     * check account status
     */

    if(fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE"){
        return res.status(400).json({
            message:"fromAccount or toAccount is not active"
        })
    }

    /**
     * check balance
     */

    const balance = await fromUserAccount.getBalance();

    if(balance < amount){
        return res.status(400).json({
            message:`Insufficient balance in fromAccount. Current balance is ${balance}`
        })
    }

    /**
     * create transaction
     */

    const session = await mongoose.startSession();
    session.startTransaction();

    const transaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"
    }, {session})

    const debitLedgerEntry = await ledgerModel.create({
        account: fromAccount,
        type: "DEBIT",
        amount: amount,
        transaction: transaction[0]._id
    }, {session})

    const creditLedgerEntry = await ledgerModel.create({
        account: toAccount,
        type: "CREDIT",
        amount: amount,
        transaction: transaction[0]._id
    }, {session})
    
    transaction.status = "COMPLETED";
    await transaction.save({session})

    await session.commitTransaction();
    session.endSession();


    /**
     * send email notification
     */
    
    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, fromUserAccount.accountNumber, toUserAccount.accountNumber)

    return res.status(201).json({
        message:"Transaction completed successfully",
        transaction
    })

}

module.exports = {
    createTransaction
}