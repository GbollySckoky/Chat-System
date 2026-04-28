import { Router } from 'express'
import { getMessages } from '../controller/messageController'
import authMiddleware  from '../middleware/authentication'

const router = Router()

/**
 * For a chat system, the best practice is:
HTTP for — anything that is a resource operation:

POST /rooms — create room
GET /rooms — list rooms
DELETE /rooms/:roomId — delete room
GET /messages/:roomId — fetch message history
DELETE /messages/:messageId — delete message

WebSocket for — anything real-time:

sendMessage
joinRoom
leaveRoom
typing... indicators
Online/offline presence
 */

// GET /api/messages/:roomId  — fetch message history for a room
router.get('/:roomId', getMessages)

// DELETE /api/messages/:messageId  — delete a message
// router.delete('/:messageId', deleteMessage)

export default router