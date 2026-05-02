// routes/notifications.ts
import { Router } from 'express'
import { getNotifications, markAsRead, markAllAsRead } from '../controller/notification'


const router = Router()

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Message and Notifications
 */

/**
 * @swagger
 * /api/v1/messages/notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: List of notification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/notifications'
 *       500:
 *         description: Internal server error
 */
router.get('/', getNotifications)
router.patch('/:notificationId', markAsRead)
router.patch('/', markAllAsRead)

export default router