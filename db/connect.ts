import mongoose from 'mongoose';

// old way
// const connectDB = (url) => {
//   return mongoose.connect(url, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false,
//     useUnifiedTopology: true,
//   })
// }

const connectDB = (url: string) => {
  return mongoose.connect(url)
}

// module.exports = connectDB
export default connectDB;
