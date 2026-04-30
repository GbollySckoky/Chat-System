import { NextFunction, Response, Request } from "express"
import { StatusCodes } from "http-status-codes";
import Messages from "../models/message";
import { AuthRequest } from "../interface/authRequest";
import Room from "../models/room";


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

// Check README.MD for details on how to implement the getChat function.
/**
 * 
 * @param req 
 * @param res 
 * @returns 
 * @find — is a Mongoose method that retrieves documents from the database that match the specified query criteria.
 * It returns an array of documents that match the query. If no documents match, it returns an empty array.
 * find — gets all documents that match the condition you pass in. No condition means everything.
 * @param — is a parameter that you can use to filter the messages you want to retrieve. 
 * You can use it to specify criteria such as userId, roomId, sender username, or content keywords to fetch specific messages 
 * from the database.
 * params — grabs a value that is part of the URL path itself, like /chat/:roomId, 
 * where :roomId is a parameter you can access with req.params.roomId.
 * @query and body — are two different ways to send data in an HTTP request.
 * query — grabs values from the query string, which is the part of the URL after the ?, 
 * like /chat?roomId=123&sender=John, where you can access roomId and sender with req.query.roomId and req.query.sender.
 * body — grabs values from the request body, which is typically used for POST or PUT requests where you send data in the body of the request, like { "content": "Hello" }, which you can access with req.body.content.
 * 
 * In a chat system, you might use these to fetch messages based on different criteria. For example, you could use query parameters to filter messages by roomId, sender username, or content keywords. This allows for flexible querying of messages based on user input.
 * 
 * The getChat function is designed to handle incoming requests to fetch chat messages based on various criteria provided through query parameters. It constructs a MongoDB query object dynamically based on the presence of these parameters and retrieves matching messages from
 */


// const getMessages = async (req: Request, res: Response) => {
//     // Your chat system logic here
//     const { userId, roomId, sender, content } = req.query ; // Extract any query parameters if needed

//     /**
//      * MongoDB query construction based on provided parameters. 
//      * This allows for flexible querying of messages based on userId, roomId, sender username, or content. 
//      * The use of regex for content allows for partial matches and case-insensitive searching.
//      * With the roomid parameter you can fetch messages specific to a chat room, 
//      * without the roomId chats will not be sorted well and it will be hard to fetch messages for a specific room.
//      */
//     // const {roomId: roomIdParam} = req.params; // Extract roomId from URL parameters if needed

//     if(!roomId) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "roomId is required" });
    
//     const queryObject: Record<string, any> = {};

//     if (userId) {
//         queryObject.userId = userId;
//     }

//     if (roomId) {
//         queryObject.roomId = roomId;
//     } 
//     if (sender) {
//         queryObject['sender.username'] = sender;
//     }
//     /**
//      * $regex lets you search for messages that contain a word, not just exact matches.
//      * $options: 'i' makes the search case-insensitive, so "Hello" and "hello" will both match.
//      * This is useful for a chat system where users might want to search for messages containing certain keywords without 
//      * worrying about exact case or full matches.
//      * 
//      * For example, if a user searches for "hello", it will return messages that contain "Hello", "hello", "HELLO", etc., 
//      * as long as "hello" is part of the message content. This enhances the search functionality and user experience in the chat system.
//      * 
//      * Without the content filter, users would only be able to search for messages that exactly match the content they provide,
//      * which can be limiting and less user-friendly in a chat environment where messages often contain more than just the search term.
//      * 
//      *  */ 
//     if (content) {
//         queryObject.content = { $regex: content, $options: 'i' }; // Case-insensitive search
//     }
//     // Fetch messages based on the queryObject
//     try {
//         /**
//          * .sort({ createdAt: -1 })  // newest message at the top
//          * .sort({ createdAt: 1 })   // oldest message at the top
//          * .sort({ createdAt: -1 })
//          * Orders the results by createdAt.
//          * -1 means newest first (descending)
//          * 1 means oldest first (ascending)
//          */
//         const messages = await Messages.find(queryObject).sort({ createdAt: -1 }).limit(50); // Example: fetch latest 50 messages
//         res.status(StatusCodes.OK).json({ success: true, data: messages });
//     } catch (error) {
//         console.error("Error fetching messages:", error);
//         res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server Error" });
//     }
// }

/** DELETE MESSAGE FLOW
 * client has a message on screen
        ↓
    user clicks delete
            ↓
    client sends the messageId to server
            ↓
    server uses that messageId to find the message in MongoDB
            ↓
    server checks if the sender.userId matches the logged in user
            ↓
    if yes → soft delete it
    if no  → return unauthorized
 */

const deleteMessage = async (req: AuthRequest, res: Response) => {
    const { messageId } = req.params;
    const userId = req?.user?.userId; // Assuming you have userId from authentication middleware

    // you defined deletedAt in the schema
    //     ↓
    // every new message gets deletedAt: null by default
    //         ↓
    // when someone deletes a message
    //         ↓
    // you set deletedAt = new Date()  ← stamps it with current time
    //         ↓
    // pre('find') hook sees deletedAt is not null
    //         ↓
    // filters it out of all queries

    if (!messageId) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "messageId is required" });
    const result = await Messages.findById(messageId);
    if (!result) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Message not found" });
    if (result.sender.userId !== userId) return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });

    result.deletedAt = new Date();
    await result.save();
    res.status(StatusCodes.OK).json({ success: true, message: "Message deleted" });
}

/**
 * client sends { content, roomId } in req.body
        ↓
check user is logged in
        ↓
validate content and roomId are present
        ↓
save message to MongoDB with sender info from req.user
        ↓
return saved message to client
 */
// const createMessage = async (req: AuthRequest, res: Response) => {
//     const {content, roomId} = req.body
//     const user = req.user

//     //  // 1. check user is authenticated
//     if(!user) throw new UnauthenticatedError("Unauthorized")
    
//     if(!content || !content.trim()) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Message cannot be empty" });
//     if(content.length > 400) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Message too long" });
//     if(!roomId) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "roomId is required" });
    
//     // roomId is coming from the client interface. roomId is the name of the group chat
    
//         const message = await Messages.create({
//             roomId,
//             sender:{
//                 userId: user.userId,
//                 username: user.name,
//                 avatar: user.avatar
//             }
//         })
//     console.log("Active message:", message);
//     // Your chat system logic here
//     res.status(StatusCodes.OK).json(
//         { 
//         success: true, 
//         result: "Message created",
//          data:message });
// }

/**
 * @swagger
 * /api/messages/{roomId}:
 *   get:
 *     summary: Get messages for a specific chat room
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat room to fetch messages from
 *       - in: query
 *         name: sender
 *         schema:
 *           type: string
 *         description: Filter messages by sender username (optional)
 *       - in: query
 *         name: content
 *         schema:
 *           type: string
 *         description: Filter messages by content keywords (optional)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (optional)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Number of messages per page (max 100)
 *     responses:
 *       200:
 *         description: A list of messages with pagination info
 *       401:
 *         description: Unauthorized (e.g., not logged in)
 *       500:
 *         description: Internal server error
 */
const getMessages = async (req: Request, res: Response, next: NextFunction) => {
    const { roomId } = req.params;
    const { sender, content, page = '1', limit = '50' } = req.query;

    const queryObject: Record<string, any> = {
        roomId,
        deletedAt: null,
    };

    if (sender) queryObject['sender.username'] = sender;
    if (content) queryObject.content = { $regex: content, $options: 'i' };

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    const [messages, total] = await Promise.all([
        Messages.find(queryObject)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum),
        Messages.countDocuments(queryObject)
    ]);

    res.status(StatusCodes.OK).json({
        success: true,
        data: messages,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
            hasMore: pageNum * limitNum < total
        }
    });
}
/**
 * @swagger
 * /api/rooms:
 *   get:
 *     summary: Get a list of chat rooms
 *     tags: [Rooms]
 *     parameters:
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
 *           default: 50
 *           maximum: 100
 *         description: Number of rooms per page (max 100)
 *     responses:
 *       200:
 *         description: A list of chat rooms with pagination info
 *       401:
 *         description: Unauthorized (e.g., not logged in)
 *       500:
 *         description: Internal server error
 */
const getRooms = async (req: Request, res: Response, next: NextFunction) => {
    // Your chat system logic here
    /**
     * deletedAt: null
     * It filters out soft-deleted rooms. When someone deletes a room you don't actually remove it from the DB — you just 
     * stamp it with a date:
     * 
     * Promise.all
     * It runs multiple async operations at the same time instead of one after another.
     * 
     * Without it:
     * const rooms = await Room.find(...)        // waits 100ms
     * const total = await Room.countDocuments() // then waits another 100ms
     * // total time: 200ms
     * 
     * With it:
     * const [rooms, total] = await Promise.all([
     * Room.find(...),          // both run
     * Room.countDocuments()    // simultaneously
     * ]) // total time: ~100ms
     * 
     * Both DB queries fire at the same time and it waits until both finish before continuing. 
     * It returns an array of results in the same order you passed them in — so rooms gets the first result, total gets the second.
     * Simple rule — whenever you have two or more await calls that don't depend on each other, use Promise.all.
     */

    const [room, totalRooms] = await Promise.all([
        Room.find({ deletedAt: null }).sort({ createdAt: -1 }),
        Room.countDocuments({ deletedAt: null })
    ]);
    // console.log("Active rooms:", room);
    res.status(StatusCodes.OK).json({ success: true, data: room, total: totalRooms });
}

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new chat room
 *     tags: [Rooms]
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
 *         description: Bad request (e.g., missing fields, invalid data)
 *       401:
 *         description: Unauthorized (e.g., not logged in)
 *       500:
 *         description: Internal server error
 */
const createRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Your chat system logic here
    const { name, description } = req.body;
    const userId = req.user?.userId;
   
    if (!name || !name.trim()) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Room name is required" });
    if(!userId) return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });

    const newRoom = await Room.create({ name, description, createdBy: userId, participants: [userId] });
    res.status(StatusCodes.CREATED).json({ success: true, message: "Room created", data: newRoom });
}

const addUserToRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { roomId } = req.params;
    const userId = req.user?.userId;

    if (!roomId) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "roomId is required" });
    if (!userId) return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });

    const room = await Room.findById(roomId);
    if (!room) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Room not found" });

    if (room.participants.includes(userId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "User already in room" });
    }
    
    room.participants.push(userId);
    await room.save();
    res.status(StatusCodes.OK).json({ success: true, message: "User added to room", data: room });
}

/**
 * @swagger
 * /api/rooms/{roomId}:
 *   delete:
 *     summary: Delete a chat room
 *     tags: [Rooms]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/deleteRoom'
 *     responses:
 *       200:
 *         description: Room deleted successfully
 *       400:
 *         description: Bad request (e.g., missing roomId)
 *       401:
 *         description: Unauthorized (e.g., not logged in or not the creator)
 *       404:
 *         description: Room not found
 *       500:
 *         description: Internal server error
 */
const deleteRoom = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Your chat system logic here
    const { roomId } = req.params;
    const userId = req.user?.userId;

    if (!roomId) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "roomId is required" });
    if (!userId) return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });

    const room = await Room.findById(roomId);
    if (!room) return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Room not found" });
    if (room.createdBy !== userId) return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });

    room.deletedAt = new Date();
    await room.save();
    res.status(StatusCodes.OK).json({ success: true, message: "Room deleted" });
}
export { getMessages, getRooms, createRoom, deleteRoom, deleteMessage, addUserToRoom }
