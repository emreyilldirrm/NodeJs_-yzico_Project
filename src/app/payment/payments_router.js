const paymentController  = require("./paymentController");

const router = require("express").Router();

router.post("/payment",paymentController.addPayment)
router.post("/payment-card-list",paymentController.card_List)
router.post("/payment-card-save",paymentController.cardSave)
router.post("/payment-card-delete",paymentController.cardDelete)

module.exports = router;