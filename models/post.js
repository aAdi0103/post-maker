const mongoose=require('mongoose')


const postSchema= mongoose.Schema({

   user:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user",
    // ref is used to estabilish the connection between post and user
    //ref: "user" , indicates that the user field in the post schema references documents from the "user" collection/model.
   }],

   date:[
    {
      type:Date,
      default:Date.now,
    }
   ],

   content:String,

   likes:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user",
   }]

})
module.exports=mongoose.model('post',postSchema)