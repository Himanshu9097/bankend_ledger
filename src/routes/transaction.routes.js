const {Router} = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const transactionController = require("../controllers/transaction.controller")

const transactionRouters = Router()

/**
 * - POST /api/transactions/
 * - Create a new transaction
 */

transactionRouters.post("/",authMiddleware.authMiddleware,transactionController.createTransaction)

/**
 * POST /api/transactions/system/initial-funds
 * create initial funds for system account
 */

transactionRouters.post("/system/initial-funds",authMiddleware.authSystemMiddleware,transactionController.createInitialFundsForSystemAccount)

module.exports = transactionRouters