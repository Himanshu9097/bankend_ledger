const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const userModel = require("../models/user.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");



/**
 * - Create a new transaction
 * The 10 steps to create a transaction are as follows:
 * 1. validate request body
 * 2. validate fromAccount and toAccount
 * 3. validate idempotency key
 * 4. check account status
 * 5. check balance
 * 6. create transaction with status PENDING
 * 7. create debit ledger entry
 * 8. create credit ledger entry
 * 9. update transaction status to COMPLETED
 * 10. send email notification to user
 */


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

    const transaction = new transactionModel({
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"
    })

    await transaction.save({session})

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromAccount,
        type: "DEBIT",
        amount: amount,
        transaction: transaction._id
    }], {session})

    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        type: "CREDIT",
        amount: amount,
        transaction: transaction._id
    }], {session})
    
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

async function createInitialFundsForSystemAccount(req,res){
    const {toAccount,amount,idempotencyKey} = req.body;

    if(!toAccount || !amount || !idempotencyKey){
        return res.status(400).json({
            message:"toAccount, amount and idempotencyKey are required"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id:toAccount,
    })

    if(!toUserAccount){
        return res.status(404).json({
            message:"toAccount not found"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })


    if(!fromUserAccount){
        return res.status(404).json({
            message:"System account not found for the user"
        })
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const transaction = new transactionModel({
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status:"PENDING"
        })

        await transaction.save({session})

        const debitLedgerEntry = await ledgerModel.create([{
            account: fromUserAccount._id,
            type: "DEBIT",
            amount: amount,
            transaction: transaction._id
        }], {session})

        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            type: "CREDIT",
            amount: amount,
            transaction: transaction._id
        }], {session})
        
        transaction.status = "COMPLETED";
        await transaction.save({session})

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            message:"Initial funds added to system account successfully",
            transaction
        })
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({
            message:"An error occurred while creating initial funds for system account",
            error: err.message
        })
    }

} 

module.exports = {
    createTransaction,
    createInitialFundsForSystemAccount
}