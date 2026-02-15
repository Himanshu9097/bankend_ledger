const {Router} = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const transactionController = require("../controllers/transaction.controller")

const transactionRouters = Router()

/**
 * - POST /api/transactions/
 * - Create a new transaction
 * - Protected Route
 */
transactionRouters.post("/",authMiddleware.authMiddleware,transactionController.createTransactionController)

module.exports = transactionRouters