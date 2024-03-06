//this allows users to perform searches based on URLs and manages user credits using a Redis database.
//It's worth noting that there might be issues with the credit management system, such as potential race conditions if multiple requests try to decrement the same user's credits simultaneously.
const express = require('express')
const runProjectsense  = require('./drive.js');
const cors = require('cors')
const Redis = require('ioredis')
const client = new Redis("rediss://default:13c2ec8f156f47a59396b43bd4e445d1@usw1-modern-camel-34330.upstash.io:34330",
{
  tls: {
    rejectUnauthorized: false
  }
});
client.on('error',(err)=>{
  console.error('Redis connection error:',err)
})

const app = express()

app.use(
  cors({
    origin: "*",
  })
)

app.get('/search', async(req, res) => {
  var query = req.query.searchUrl
  const uid = req.query.userId

  const pattern = /^https:\/\//
  if(!pattern.test(query)){
    query = "https://" + query;
  }

  try{
    const user = await client.get(uid);
    if(user === "0"){
      res.status(402).json({error: "Not Sufficient Credis"})
    }
  } catch(error){
    res.status(500).json({error: "Server Problem"})
  }
  const output = {URL: query};
  (async () => {
    try {
      const results = await runProjectsense(query)
      const tech = results.technologies
      tech.forEach((t) => {
        const name = t.name
        const category = t.categories[0].name
        const desc = t.description
        const ts = {
          name,
          description: desc,
        }
        if (output.hasOwnProperty(category)) {
          output[category].push(ts)
        } else {
          output[category] = [ts]
        }
      })
      if(Object.keys(output).length == 0){
        throw new Error("error")
      }
      try{
        const user = await client.get(uid);
        const newcredit = user-1
        client.set(uid,newcredit);
        if(user === "0"){
          res.status(402).json({error: "Not Sufficient Credis"})
        }
      } catch(error){
        res.status(500).json({error: "Server Problem"})
      }
      res.json(output)
    } catch(error) {
      res.status(400).json({'code':400, 'message':'Bad URL'})
    }
  })()
})

app.get("/testport", (req, res) => {
  res.status(200).send("server at port: 5000 is up and good!");
})

app.listen(5000, () => {
  console.log("Listening to port 5000")
})
