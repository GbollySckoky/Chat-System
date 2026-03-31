import mongoose from 'mongoose';


const Auth = new mongoose.Schema({
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

export default mongoose.model('Auth', Auth);