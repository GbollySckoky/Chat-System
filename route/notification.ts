import { Router } from 'express'
import { getNotifications, markAsRead, markAllAsRead } from '../controller/notification'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management
 */

/**
 * @swagger
 * /api/v1/notifications/:
 *   get:
 *     summary: Get all notifications for the authenticated user
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       500:
 *         description: Internal server error
 */
router.get('/', getNotifications)

/**
 * @swagger
 * /api/v1/notifications/{notificationId}:
 *   patch:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the notification to mark as read
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:notificationId', markAsRead)

/**
 * @swagger
 * /api/v1/notifications/:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       500:
 *         description: Internal server error
 */
router.patch('/', markAllAsRead)

export default router