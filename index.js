const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:5173"
  ],
  credentials: true
}));
app.use(express.json())
app.use(cookieParser())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7u0ly7l.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const logger = async (req, res, next) => {
  console.log('called:', req.host, req.originalUrl)
  next();
}

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
      return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
      if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
      }
      req.user = decoded;
      next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

const tabsCategoryCollections = client.db('luxeMarketProCollection').collection('CategoryNameCollection');
const addJobsCollections = client.db('luxeMarketProCollection').collection('addJobsCollection');
const JobsBidsCollection = client.db('luxeMarketProCollection').collection('JobsBidsCollection');
 

app.post('/jwt', async (req, res) => {
  const user = req.body;
  console.log('user for token', user);
  const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
})
    .send({ success: true });
})

app.post('/logout', async (req, res) => {
  const user = req.body;
  console.log('logging out', user);
  res.clearCookie('token', { maxAge: 0 }).send({ success: true })
})

// tabs
app.get('/tabsCategory', async(req, res) => {
    const cursor = tabsCategoryCollections.find()
    const result = await cursor.toArray();
    res.send(result)
  })

  

app.post('/addJobs', async(req, res) => {
    const newJobs = req.body;
    const result = await addJobsCollections.insertOne(newJobs)
    res.send(result)
 })
 app.get('/tabs/:category', async(req, res) => {
  const name = req.params.category;
  const query = {category: name}
  const result = await addJobsCollections.find(query).toArray();
  res.send(result)

})

app.get("/allJobs", async(req, res) => {
  const allJobs = await addJobsCollections.find().toArray()
  res.send(allJobs)
})


 app.get('/allJobs/:id', async(req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id)};
  const result = await addJobsCollections.findOne(query);
  res.send(result);
})
//for the client my post page require(crypto).randomBytes(64)
app.put('/allJobs/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const option = { upsert: true }
  const updatedProducts = req.body;
  const products = {
      $set: {
          email: updatedProducts.email,
          jobTitle: updatedProducts.jobTitle,
          deadline: updatedProducts.deadline,
          description: updatedProducts.description,
          category: updatedProducts.category,
          minimumPrice: updatedProducts.minimumPrice,
          maximumPrice: updatedProducts.maximumPrice,

      }
  }
  const result = await addJobsCollections.updateOne(filter, products, option);
  res.send(result)
})
app.put('/jobsBids/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) }
  const option = { upsert: true }
  const updatedProducts = req.body;
  const products = {
      $set: {
        status: updatedProducts.status,
          

      }
  }
  const result = await JobsBidsCollection.updateOne(filter, products, option);
  res.send(result)
})

app.get('/myPost', verifyToken, logger,  async (req, res) => {
  if(req.query.email !== req.user.email){
    return res.status(403).send({message: 'forbidden access'})
}

  let query = {};
  if (req.query?.email) {
      query = { email: req.query.email }
  }
  const result = await addJobsCollections.find(query).toArray();
  res.send(result);
})

app.delete('/myPost/:id', async(req, res) => {
  
  const id = req.params.id;
  const query = {_id: new ObjectId(id)}
  const result = await addJobsCollections.deleteOne(query)
  res.send(result);
 })
//  for my bids page
app.post('/jobsBids', async(req, res) => {
  const newJobsBids = req.body;
  const result = await JobsBidsCollection.insertOne(newJobsBids)
  res.send(result)
})
app.get('/jobBids', logger, verifyToken, async(req, res) => {
  console.log(req.query.email);
  console.log('user in the valid token', req.user)
  if(req.query.email !== req.user.email){
      return res.status(403).send({message: 'forbidden access'})
  }

  let query = {};
  if (req.query?.email) {
      query = { email: req.query.email }
  }
  const result = await JobsBidsCollection.find(query).toArray();
  res.send(result);
})
// for bids request page
app.get('/bidRequest', logger, verifyToken, async(req, res) => {
  if(req.query.email !== req.user.buyer_email){
    return res.status(403).send({message: 'forbidden access'})
}
  let query = {};
  if (req.query?.buyer_email) {
      query = { buyer_email: req.query.buyer_email }
  }
  const result = await JobsBidsCollection.find(query).toArray();
  res.send(result);
})








app.get("/", (req, res) => {
    res.send("Welcome to our Luxe Market Pro")
})
app.listen(port, () => {
    console.log(`Welcome to our Luxe Market Pro ${port}` );
})