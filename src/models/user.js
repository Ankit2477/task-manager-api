const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Tasks = require('./tasks')


const userSchema = new mongoose.Schema({
    name:{
     type: String,
     required: true,
     trim: true
   
    },
    age:{
      type: Number,
      default:0,
      validate(value) {
          if(value <0){
              throw new Error('Age must be a positive number')
          }
      }
    },
   
    email:{
      type: 'String',
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      validate(value){
          if(!validator.isEmail(value)){
              throw new Error("Email is invalid")
          }
      }
    },
   
    password:{
        type: 'String',
        trim:true,
        required: true,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error("Choose different password")
            }
        },
        validate(value){
            if(value.length<6){
                throw new Error("Password length should more than 6!")
            }
        }
   
    },

    token: [{
        token:{
            type: String,
            required: true
        }
    }], 
    avatar: {
         type: Buffer
    }


   },{
       timestamps: true
   })

   userSchema.methods.toJSON = function() {
       const user = this
       const userObject = user.toObject()

       delete userObject.password
       delete userObject.token
       delete userObject.avatar
       
       return userObject
   }


    userSchema.virtual('tasks', {
        ref: 'Tasks',
        localField: '_id',
        foreignField: 'owner'
    })

   // Genrate tokens
    userSchema.methods.genrateAuthToken = async function () {
          const user = this
          const token = jwt.sign({ _id:user._id.toString() }, (process.env.JWT_SECRET))

          user.token = user.token.concat({token})
          user.save()

          return token
    }

    userSchema.statics.findByCredentials = async (email, password) => {    // statics accesible models and methods are accesible to instance
          const user = await User.findOne({email})
          if(!user){
              throw new Error('Unable to find user!')
          }

          const isMatch = await  bcrypt.compare(password, user.password)

          if(!isMatch){
              throw new Error('Unable to login')
          }

          return user

    }

   //Hash the plaintext password befoe saving
   userSchema.pre('save', async function(next){
    const user = this  
    if (user.isModified('password')){
      user.password = await bcrypt.hash(user.password, 8)
    }

      next()
   })


   userSchema.pre('remove', async function(next) {
       const user = this
       await Tasks.deleteMany({owner: user._id})
       next()
   })
   
const User = mongoose.model('User', userSchema)
   

   module.exports = User