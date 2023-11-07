const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())



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
app.post('/jobsBids', async(req, res) => {
    const newJobsBids = req.body;
    const result = await JobsBidsCollection.insertOne(newJobsBids)
    res.send(result)
 })
 app.get('/allJobs/:id', async(req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id)};
  const result = await addJobsCollections.findOne(query);
  res.send(result);
})

app.get('/myPost',  async (req, res) => {
  let query = {};
  if (req.query?.email) {
      query = { email: req.query.email }
  }
  const result = await addJobsCollections.find(query).toArray();
  res.send(result);
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







app.get("/", (req, res) => {
    res.send("Welcome to our Luxe Market Pro")
})
app.listen(port, () => {
    console.log(`Welcome to our Luxe Market Pro ${port}` );
})