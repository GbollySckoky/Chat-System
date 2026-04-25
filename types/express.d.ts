import "express";

// with this i can do a auth check in every module i want without importing the interface every time
// for example in messageController.ts i can do req.user?.userId without importing the AuthRequest interface
// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         userId: string;
//         name: string;
//       };
//     }
//   }
// }

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string;
      name: string;
    };
  }
}

