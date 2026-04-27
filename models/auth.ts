import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'
import jwt  from 'jsonwebtoken'
require('dotenv').config();


/**
 * When you extend Document, Mongoose's Document type already includes built-in properties like _id, 
 * save(), toJSON(), etc. So by doing interface IAuth extends Document, your IAuth interface inherits all of 
 * those automatically, and you only need to add your own custom fields on top.
 * 
 * Document → _id, save(), toJSON(), etc.
    +
IAuth  → name, email, password, createJWT(), comparePassword()
    =
Full Mongoose document with your custom fields
 */
interface IAuth extends Document {
    name: string;
    email: string;
    password: string;
    createJWT: () => string;
    comparePassword: (candidatePassword: string) => Promise<boolean>;
    avatar?: string;
}


const AuthSchema = new mongoose.Schema<IAuth>({
    name: {
        type: String,
        required: [true, 'Name is required'],
        minLength: 3,
        maxLength: 50,
        unique: false
    },
    email:{
        type: String,
        require: [true, 'Please provide an email'],
        match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, //regex
        'Please provide a valid email'
        ],
        unique: true
    },
    password: {
        type: String,
        require: [true, 'Please provide a password'],
        minLength: 6
    },
    avatar: {
        type: String,
        default: null
    }
});

// module.exports = mongoose.model('Auth', Auth);



// Hash Passsword
AuthSchema.pre('save', async function (next) {
    const userSalt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, userSalt);
    next();
});


// process.env.JWT_SECRET_KEY u still need to look into the all keys generator
// This function creates a JWT (JSON Web Token) for a user. Here's a breakdown:
// In simple terms — after a user signs up or logs in, you call user.createJWT() and send the token back to the client. 
// The client stores it and sends it with every request to prove they're logged in, instead of sending their 
// password every time.
AuthSchema.methods.createJWT = function () {
    return jwt.sign({ userId: this._id, name: this.name }, 
        process.env.JWT_SECRET_KEY as string, 
        { expiresIn: process.env.JWT_LIFETIME as any }
    );
}

AuthSchema.methods.comparePassword = async function (candidatePassword: string) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
}

export default mongoose.model('Auth', AuthSchema);