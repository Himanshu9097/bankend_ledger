const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const accountController = require("../controllers/account.controller")

const router = express.Router()

/**
 * - POST /api/accounts/
 * - Create a new account
 * - Protected Route
 */
router.post("/",authMiddleware.authMiddleware,accountController.createAccountController)

/**
 * - GET /api/accounts/
 * - Get balance of user's account
 * - Protected Route
 */

router.get("/",authMiddleware.authMiddleware,accountController.getUserAccountsController)

/**
 * - GET /api/accounts/:accountId/balance
 * - Get balance of user's account
 * - Protected Route
 */

router.get("/balance/:accountId",authMiddleware.authMiddleware,accountController.getAccountBalanceController)


module.exports = router