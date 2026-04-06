const express = require('express');
const router = express.Router();
import { signUp, login } from "../controller/auth";

router.route('/sign-up').post(signUp)

module.exports = router;