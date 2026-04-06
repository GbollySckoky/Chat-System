import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'
import jwt  from 'jsonwebtoken'
require('dotenv').config();


const AuthSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        unique: true
    },
    email:{
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [/\S+@\S+\.\S+/, 'Email is invalid']
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    }
});

// module.exports = mongoose.model('Auth', Auth);

export default mongoose.model('Auth', AuthSchema);

// Hash Passsword
AuthSchema.pre('save', async function (next) {
    const userSalt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, userSalt);
    next();
});


// process.env.JWT_SECRET u still need to look into the all keys generator
// This function creates a JWT (JSON Web Token) for a user. Here's a breakdown:
// In simple terms — after a user signs up or logs in, you call user.createJWT() and send the token back to the client. 
// The client stores it and sends it with every request to prove they're logged in, instead of sending their 
// password every time.
AuthSchema.methods.createJWT = function () {
    return jwt.sign({ userId: this._id, name: this.name }, 
        process.env.JWT_SECRET as string, 
        { expiresIn: process.env.JWT_LIFETIME as any }
    );
}

