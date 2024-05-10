const express=require('express')
const app=express();
const path=require('path')
const jwt=require('jsonwebtoken')
const bcrypt=require('bcrypt');
const userModel=require('./models/user')
const postModel=require('./models/post')
const multerconfig=require('./config/multer')
const cookieParser = require('cookie-parser');

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.use(cookieParser());

// first page
app.get('/',function(req,res){
    res.render('index.ejs')
})


app.post('/register', async function(req, res) {
    let { username, name, email, password } = req.body; // extracting data from form

    // Check if user already exists
    let user = await userModel.findOne({ email });
    if (user) {
        return res.status(500).send("User already registered");
    }

    // Generate salt and hash password before creating user and put password to hash
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, async function(err, hash) {
            let createdUser = await userModel.create({
                username,
                name,
                email,
                password: hash // putting password hash
            });
            
         //  it will make sure that as i am registered now i am logged in too at the same time
            let token = jwt.sign({ email, userid: createdUser._id }, 'shhhh');

            res.cookie('token', token); // using this i can set a cookie here named token
            res.redirect('/profile'); // redirecting to their account

        });
    });
});


app.get('/login',function(req,res){
  res.render('login.ejs');
})

// to login user
app.post('/login',async function(req,res){

    let {email,password}=req.body;


    let user= await userModel.findOne({email});

    // checking that user exist or not with given email
    if(!user) res.status(500).send("Something Went wrong!!!");

    bcrypt.compare(password,user.password,function(err,result){
        if(result) { 
            let token = jwt.sign({ email}, 'shhhh');
            res.cookie('token', token);
            res.status(200).redirect('/profile')
        }
        else res.redirect('/login');
    })
})

// to logout user
app.get('/logout',function(req,res){
    res.cookie('token',"");
    res.redirect('/login')
})

// profile route 
app.get('/profile',isLoggedIn, async function(req,res){
let user = await userModel.findOne({email:req.user.email}).populate('posts');
  res.render('profile.ejs',{user})
})


// making posts in post database
app.post('/post', isLoggedIn, async function(req,res){

  // line 81 will make sure that the route '/post' is accessed by only logged in user 
  // it is necessary to perform this to handle any route which must performed after login

  let user= await userModel.findOne({email:req.user.email});

  let{content}=req.body;
  let post=await postModel.create({
      user:user._id,
      content
  })
  user.posts.push(post._id); // pushing post to posts array
  await user.save(); // to save changes to database
  res.redirect('/profile');
})

// to delete posts
app.get('/delete/:id',async function(req,res){
  let post=await postModel.findOneAndDelete({_id:req.params.id})

//   const users = await userModel.findOneAndUpdate(
//     { _id: post.user },
//     { $pull: { posts: post._id } },
//     { new: true }
// );

  res.redirect('/profile');

})

// to like post
app.get('/likes/:id',isLoggedIn,async function(req,res){
    let post = await postModel.findOne({_id:req.params.id}).populate('user');
    if(post.likes.indexOf(req.user.userid)===-1) {
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
    await post.save();
    res.redirect('/profile');
})

// to edit post
app.get('/edit/:id',isLoggedIn,async function(req,res){
    let post=await postModel.findOne({_id:req.params.id}).populate('user');
    res.render('edit.ejs',{post})
})

// to update post
app.post('/update/:id',isLoggedIn,async function(req,res){
    let post=await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content});
    res.redirect('/profile');
})

// Photo uplodation 

app.get('/upload',function(req,res){
    res.render('uploadpic');
})

app.post('/uploadprofile',isLoggedIn,multerconfig.single('image'),async function(req,res){
    // console.log(req.file);
let user= await userModel.findOne({email:req.user.email});
   user.profilepic=req.file.filename;
   await user.save();
   res.redirect('/profile')
})


// middleware

// This middleware makes sure before any request that the user who is requesting 
// the user is logged in or not 

function isLoggedIn(req,res,next){
    if(req.cookies.token=="") res.redirect('/login'); // means user in not loggedIn

    else{
        let data=jwt.verify(req.cookies.token,"shhhh");
        req.user=data //req.user contains the data that is given when token were created 
        next(); // it will pass request to the next route if we not mentioned it the req will be hanging there
    }
}



app.listen(3000)