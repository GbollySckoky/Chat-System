import Auth from "../models/auth"

const signUp = async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     const user = new Auth({ username, password });
//     await user.save();
//     res.status(201).json({ message: "User created successfully" });
//   } catch (error: any) {
//     res.status(500).json({ message: error.message });
//   }
const user = await Auth.create({...req.body});
console.log(user);
}