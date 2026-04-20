import { Router } from 'express'
import { getMessages, deleteMessage } from '../controller/messageController'
import authMiddleware  from '../middleware/authentication'

const router = Router()

// GET /api/messages/:roomId  — fetch message history for a room
router.get('/:roomId', authMiddleware, getMessages)

// DELETE /api/messages/:messageId  — delete a message
router.delete('/:messageId', authMiddleware, deleteMessage)

export default router