const User = require('../models/User')
const bcrypt = require('bcrypt')
require('dotenv').config()
const jwt = require('jsonwebtoken')

exports.signup = async(req,res) =>{
    try{
        const{name,email,password} = req.body;
        const existingUser = await User.findOne({email});
        if(existingUser) return res.status(400).json({message:'Email Already Exists'})
        const hashedPassword = await bcrypt.hash(password,10)
        const user = new User({name,email,password:hashedPassword})
        await user.save();
        res.status(201).json({message:'Signup Successful'});
    }
    catch(e){
        res.status(500).json({message:'Signup Failed',error:error.message})
    }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
  
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};


