// routes/notifications.ts
import { Router } from 'express'
import { getNotifications, markAsRead, markAllAsRead } from '../controller/notification'


const router = Router()

router.get('/', getNotifications)
router.patch('/:notificationId', markAsRead)
router.patch('/', markAllAsRead)

export default router