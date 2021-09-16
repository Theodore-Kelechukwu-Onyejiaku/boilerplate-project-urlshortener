require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
const dns = require("dns")
const URL = require('url').URL;

// const nanoid = require("nanoid");


// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded());

app.use('/public', express.static(`${process.cwd()}/public`));

mongoose.connect(process.env.DB_LOCAL);

const db = mongoose.connection;

db.on("error", ()=>{
  console.error.bind(console, 'MongoDB connection error:')
})

db.on("open", ()=>{
  console.log("database running successfully");
})


const shortURL = mongoose.model("shortURL" , new mongoose.Schema({
    original_url: String,
    short_url : String,
  })
)



app.get('/',  function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', async function(req, res) {
  let url = req.body.url;
  if(!(url.startsWith("https") || url.startsWith("http"))){
    res.json({
      error: "Invalid Url"
    })
    return
  }
  const urlObject = new URL(url);
  dns.lookup(urlObject.hostname, (error, address, family)=>{
    if(error) {
      res.json({
        error: "Invalid Url"
      })
      return
    }
  })

  const dbUrl = await shortURL.findOne({original_url : url}).select("-_id -__v");
  if(dbUrl){
    res.json(dbUrl)
    return;
  }
  const newShortUrl = new shortURL({
    original_url: req.body.url,
    short_url : Math.floor(Math.random() * 1000) + 1,  //to 1000
  })
  
  try {    
    const savedUrl = await newShortUrl.save();

    res.json({
      original_url: req.body.url,
      short_url: savedUrl.short_url
    });
  } catch (error) {
    res.json({
      error: error.message
    })
  }

});

app.get("/api/shorturl/:shortUrl", async function(req, res){
  const dbUrl = await shortURL.findOne({short_url : req.params.shortUrl}).select("-_id -__v");
  if(dbUrl){
    res.redirect(dbUrl.original_url)
  }
  else{
    res.send("Not found")
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
