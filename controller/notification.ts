// controller/notificationController.ts
import { Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import Notifications from '../models/notifcations'
import { AuthRequest } from '../interface/authRequest'

// GET /api/notifications — get all notifications for logged in user
const getNotifications = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId

    const notifications = await Notifications.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20)

    const unreadCount = await Notifications.countDocuments({ 
        userId, 
        read: false 
    })

    res.status(StatusCodes.OK).json({ 
        success: true, 
        data: notifications,
        unreadCount
    })
}

// PATCH /api/notifications/:notificationId — mark one as read
const markAsRead = async (req: AuthRequest, res: Response) => {
    const { notificationId } = req.params

    await Notifications.findByIdAndUpdate(notificationId, { read: true })
    res.status(StatusCodes.OK).json({ success: true })
}

// PATCH /api/notifications — mark all as read
const markAllAsRead = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId

    await Notifications.updateMany({ userId, read: false }, { read: true })
    res.status(StatusCodes.OK).json({ success: true })
}

export {markAllAsRead, markAsRead, getNotifications}