import mongoose from 'mongoose';


const Rooms = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Room name is required'],
        unique: true
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Rooms', Rooms);