import { NextFunction, Response, Request } from "express"
import { StatusCodes } from "http-status-codes";
import Messages from "../models/message";
import { AuthRequest } from "../interface/authRequest";

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


const getMessages = async (req: Request, res: Response) => {
    // Your chat system logic here
    const { userId, roomId, sender, content } = req.query ; // Extract any query parameters if needed

    /**
     * MongoDB query construction based on provided parameters. 
     * This allows for flexible querying of messages based on userId, roomId, sender username, or content. 
     * The use of regex for content allows for partial matches and case-insensitive searching.
     * With the roomid parameter you can fetch messages specific to a chat room, 
     * without the roomId chats will not be sorted well and it will be hard to fetch messages for a specific room.
     */
    // const {roomId: roomIdParam} = req.params; // Extract roomId from URL parameters if needed

    if(!roomId) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "roomId is required" });
    
    const queryObject: Record<string, any> = {};

    if (userId) {
        queryObject.userId = userId;
    }

    if (roomId) {
        queryObject.roomId = roomId;
    } 
    if (sender) {
        queryObject['sender.username'] = sender;
    }
    /**
     * $regex lets you search for messages that contain a word, not just exact matches.
     * $options: 'i' makes the search case-insensitive, so "Hello" and "hello" will both match.
     * This is useful for a chat system where users might want to search for messages containing certain keywords without 
     * worrying about exact case or full matches.
     * 
     * For example, if a user searches for "hello", it will return messages that contain "Hello", "hello", "HELLO", etc., 
     * as long as "hello" is part of the message content. This enhances the search functionality and user experience in the chat system.
     * 
     * Without the content filter, users would only be able to search for messages that exactly match the content they provide,
     * which can be limiting and less user-friendly in a chat environment where messages often contain more than just the search term.
     * 
     *  */ 
    if (content) {
        queryObject.content = { $regex: content, $options: 'i' }; // Case-insensitive search
    }
    // Fetch messages based on the queryObject
    try {
        /**
         * .sort({ createdAt: -1 })  // newest message at the top
         * .sort({ createdAt: 1 })   // oldest message at the top
         * .sort({ createdAt: -1 })
         * Orders the results by createdAt.
         * -1 means newest first (descending)
         * 1 means oldest first (ascending)
         */
        const messages = await Messages.find(queryObject).sort({ createdAt: -1 }).limit(50); // Example: fetch latest 50 messages
        res.status(StatusCodes.OK).json({ success: true, data: messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server Error" });
    }
}

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

const createMessage = async (req: Request, res: Response) => {
    // Your chat system logic here
    res.status(StatusCodes.OK).json({ success: true, message: "Message created" });
}

export { getMessages, deleteMessage }