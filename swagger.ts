"use strict"
const swaggerJSDoc = require("swagger-jsdoc")

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chat System API",
      version: "1.0.0",
      description: "API documentation for the Chat System",
    },
    servers: [
      { url: "http://localhost:5000/", description: "Development server" },
      { url: "https://chat-system-1-wyk6.onrender.com", description: "Production server" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {          // ✅ only auth schemes go here
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {               // ✅ all your models go here
        CreateUser: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'johndoe' },
            email: { type: 'string', example: 'johndoe@gmail.com' },
            password: { type: 'string', example: 'password123' }
          }
        },
        Login: {
          type: 'object',
          properties: {
            email: { type: 'string', example: 'gbolly@gmail.com' },
            password: { type: 'string', example: 'password123' }
          }
        },
        CreateRoom: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'General Chat' },
            description: { type: 'string', example: 'A place for general discussions' }
          }
        },
        SendMessage: {
          type: 'object',
          properties: {
            roomId: { type: 'string', example: '60d0fe4f5311236168a109ca' },
            content: { type: 'string', example: 'Hello, everyone!' },
            type: { type: 'string', enum: ['text', 'image', 'file'], example: 'text' }
          }
        },
        Message: {
          type: 'object',
          properties: {
            roomId: { type: 'string', example: '60d0fe4f5311236168a109ca' },
            content: { type: 'string', example: 'Hello!' },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 }
          }
        },
        Room: {
          type: 'object',
          properties: {
            roomId: { type: 'string', example: '60d0fe4f5311236168a109ca' },
            name: { type: 'string', example: 'General Chat' }
          }
        },
        deleteMessage: {
          type: 'object',
          properties: {
            messageId: { type: 'string', example: '60d0fe4f5311236168a109ca' }
          }
        },
         deleteRoom: {
            type: 'object',
            properties: {
              roomId: { type: 'string', example: '60d0fe4f5311236168a109ca' }
            }
          }
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./route/**/*.ts"],  // ✅ apis is outside definition, inside options
}

const swaggerSpec = swaggerJSDoc(options)

export default swaggerSpec;