import { Router } from 'express'
import { getMessages, getRooms, createRoom, deleteRoom, deleteMessage, addUserToRoom } from '../controller/messageController'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message and room management
 */

/**
 * @swagger
 * /api/v1/messages/rooms:
 *   get:
 *     summary: Get all rooms
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: List of rooms
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       500:
 *         description: Internal server error
 */
router.get('/rooms', getRooms)

/**
 * @swagger
 * /api/v1/messages/rooms:
 *   post:
 *     summary: Create a new room
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoom'
 *     responses:
 *       201:
 *         description: Room created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/rooms', createRoom)

/**
 * @swagger
 * /api/v1/messages/rooms/{roomId}/users:
 *   post:
 *     summary: Add a user to a room
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the room to add the user to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/addUserToRoom'
 *     responses:
 *       200:
 *         description: User added to room successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Room or user not found
 *       500:
 *         description: Internal server error
 */ 
router.post('/rooms/:roomId/users', addUserToRoom)

/**
 * @swagger
 * /api/v1/messages/rooms/{roomId}:
 *   delete:
 *     summary: Delete a room
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the room to delete
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *       403:
 *         description: Not authorized to delete this room
 *       404:
 *         description: Room not found
 *       500:
 *         description: Internal server error
 */
router.delete('/rooms/:roomId', deleteRoom)

/**
 * @swagger
 * /api/v1/messages/{roomId}:
 *   get:
 *     summary: Fetch message history for a room
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the chat room
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: A paginated list of messages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Room not found
 *       500:
 *         description: Internal server error
 */
router.get('/:roomId', getMessages)

/**
 * @swagger
 * /api/v1/messages/{messageId}:
 *   delete:
 *     summary: Delete a message
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the message to delete
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       403:
 *         description: Not authorized to delete this message
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:messageId', deleteMessage)

export default router