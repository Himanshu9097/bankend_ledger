const mongoose = require("mongoose")

const ledgerSchema = new mongoose.Schema({
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Ledger entry must be associated with an account"],
        index:true,
        imutable:true
    },
    amont:{
        type:Number,
        required:[true,"Amount is required for creating a ledger entry"],
        min:[0,"Ledger entry amount cannot be negative"],
        imutable:true
    },
    transaction:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"transaction",
        required:[true,"Ledger entry must be associated with a transaction"],
        index:true,
        imutable:true
    },
    type:{
        type:String,
        enum:{
            values:["DEBIT","CREDIT"],
            message:"Ledger entry type can be either DEBIT or CREDIT"
        },
        required:[true,"Ledger entry type is required"],
        imutable:true
    }
},{
    timestamps:true
})

function preventLedgerModification(){
    throw new Error("Ledger entries cannot be modified or deleted")
}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre('updateOne', preventLedgerModification);
ledgerSchema.pre('deleteOne', preventLedgerModification);
ledgerSchema.pre('findOneAndDelete', preventLedgerModification);
ledgerSchema.pre('findOneAndRemove', preventLedgerModification);
ledgerSchema.pre('remove', preventLedgerModification);
ledgerSchema.pre('deleteMany', preventLedgerModification);

const ledgerModel = mongoose.model("ledger",ledgerSchema)

module.exports = ledgerModel