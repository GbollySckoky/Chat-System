"use strict"

const swaggerJSDoc = require("swagger-jsdoc")
const swaggerUi = require("swagger-ui-express")

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chat System API",
      version: "1.0.0",
      description: "API documentation for the Chat System",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
      { url: 'http://localhost:5000', description: 'Production server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {        // 👈 Just a name you pick (could be "jwtAuth", anything)
            type: 'http',      // Auth is sent via HTTP Authorization header
            scheme: 'bearer',  // Specifically the "Bearer <token>" format
            bearerFormat: 'JWT', // Cosmetic hint — tells readers it's a JWT
        },
        CreateUser:{
            type: 'object',
            properties: {
                username: {
                    type: 'string',
                    example: 'johndoe'
                },
                email: {
                    type: 'string',
                    example: 'johhndoe@gmail.com'
                },
                password: {
                    type: 'string',
                    example: 'password123'
                }
            }
        },
        Login:{
            type: 'object',
            properties: {
                email: {
                    type: 'string',
                    example: 'gbolly@gmail.com'
                },
                password: {
                    type: 'string',
                    example: 'password123'
                }
            }
        }
    }
    },
    security: [
      {
        bearerAuth: [], // 👈 This references the "bearerAuth" scheme defined above. Apply JWT GLOBALLY EVERY ROUTE NEEDS A TOKEN/AUTORIZATION
      },
    ],
  },
  apis: ["./routes/*.ts"], // where your route docs live
}

const swaggerSpec = swaggerJSDoc(options)

export { swaggerSpec, swaggerUi }