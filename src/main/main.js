//this script provides an API for fetching data from URLs, processing CSV files, managing user credits, and downloading files.
//It integrates with Redis for user credit management and uses various middleware for handling requests and serving static files.
const path = require('path');
const express = require('express');
const fetch = require('node-fetch');
const csv = require('csv-parser');
const json2csv = require('json2csv').parse;
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const Redis = require('ioredis');
const multer=require('multer');
const client = new Redis("redis://default:13c2ec8f156f47a59396b43bd4e445d1@usw1-modern-camel-34330.upstash.io:34330",
  {
    tls: {
      rejectUnauthorized: false
    }
  });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

const mainApp = express()

mainApp.use(cors({ origin: "*" }))

mainApp.use(bodyParser.urlencoded({ extended: true }))
mainApp.use('/api/csv', express.static(path.join(__dirname, 'uploads')));

mainApp.get("/api/url", async (req, res) => {
  const url = req.query.userUrl;
  const uid = req.query.userId
  try {
    const response = await fetch(`http:localhost:5000/search?searchUrl=${encodeURIComponent(url)}&userId=${uid}`);

    if (response.status == 400) {
      throw new Error("Bad URL")
    }
    const data = await response.json()

    const fields = Object.keys(data)
    const new_data = {}
    new_data['URL'] = url
    fields.forEach(key => {
      if (key !== "URL") {
        if (data[key].length > 0) {
          var temp = ""
          for (let i = 0; i < data[key].length; i++) {
            temp += data[key][i].name + ","
          }
          new_data[key] = temp;
        } else {
          new_data[key] = '';
        }
      }
    });

    const csv = json2csv(new_data, { fields })

    fs.writeFile('output.csv', csv, (err) => {
      if (err)
        throw new Error(err.message)
    })

    res.json(data)
  } catch (error) {
    res.status(400).json({ 'error': error.message || 'Error while parsing URL' })
  }
})

mainApp.post("/api/csv", upload.single('csvFile'), async (req, res) => {

  try {
    const file = req.file
    const uid = req.body.userId
    const result = []
    //Asynchronously process the uploaded CSV file
    fs.createReadStream(file.path)
      .pipe(csv())
      .on('data', data => result.push(data))
      .on('end', async () => {
        const promises = result.map(async (entry) => {
          try {
            const response = await fetch(`http://localhost:5000/search?searchUrl=${encodeURIComponent(entry.website)}&userId=${uid}`);
            if (response.status === 400) {
              throw new Error("Bad URL")
            }
            var newResponse = await response.json()

            return newResponse;
          } catch (error) {
            return { error: `Error fetching data for ${entry.website}: ${error.message}` };
          }
        });

        const response_send = await Promise.all(promises);
        var responseString = ""
        var flag = 0;
        response_send.forEach(result => {
          const fields = Object.keys(result)
          const new_data = {}
          new_data['URL'] = result['URL']
          fields.forEach(key => {
            if (key !== "URL") {
              if (result[key].length > 0) {
                var temp = ""
                for (let i = 0; i < result[key].length; i++) {
                  temp += result[key][i].name + ","
                }
                new_data[key] = temp;
              } else {
                new_data[key] = '';
              }
            }
          });
          if (flag == 0) {
            const header = json2csv([], { fields });
            var csv = json2csv(new_data, { fields })
            responseString += csv + '\n'
            flag = 1;
          } else {
            var csv = json2csv(new_data, { fields, header: false })
            responseString += csv + '\n'
          }


        })
        fs.writeFile('output.csv', responseString, (err) => {
          if (err)
            throw new Error(err.message)
        })
          res.status(200).json({ "message": response_send });
      })

  } catch (error) {
    res.status(400).json({ 'code': error.code, 'message': error })
  }
})

mainApp.post("/check-credit", async (req, res) => {

  const userId = req.query.userId;

  try {
    const user = await client.get(userId);
    if (!user) {
      await client.set(userId, 50);
      newUser = await client.get(userId);
      res.json({ user_credit: user })
    } else {
      res.json({ user_credit: user })
    }

  } catch (error) {
    res.status(401).json({ error: "Error due to something" })
  }
})

mainApp.get('/download', (req, res) => {
  res.download('./output.csv')
});

mainApp.get('/testport', (req, res) => {
  res.status(200).send("server at port: 5500 is up and good!");
})

mainApp.listen(5500, () => {
  console.log("Running at 5500")
});

