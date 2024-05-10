const multer=require('multer');
const path=require('path');
const crypto=require('crypto')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/uploads');
    },
    filename: function (req, file, cb) {
      crypto.randomBytes(12,function(err,name){
        const fn=name.toString('hex')+path.extname(file.originalname); // giving unique name to file to overcome
        cb(null,fn);
      })
    }
  })
  
  const upload = multer({ storage: storage })

  module.exports=upload