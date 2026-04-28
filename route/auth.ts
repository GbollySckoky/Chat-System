const express = require('express');
const router = express.Router();
import { signUp, login } from "../controller/auth";

/**
 * @swagger * tags:
 *   name: Auth
 *   description: User authentication and registration
 *  post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *              $ref: '#/components/schemas/CreateUser' 
 *            responses:
 *            201:
 *              description: User registered successfully
 *            400:
 *              description: Bad request (e.g., missing fields, invalid data)
 *          409:    
 *             description: Conflict (e.g., email already exists)
 *      
 *            500:
 *              description: Internal server error
 * post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *    responses:
 *      200:
 *       description: User logged in successfully
 *      400:
 *       description: Bad request (e.g., missing fields, invalid data)
 *     401:
 *      description: Unauthorized (e.g., incorrect email or password)
 *     500:
 *      description: Internal server error
 */
router.route('/sign-up').post(signUp)
router.route('/login').post(login)


export default router;