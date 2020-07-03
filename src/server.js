const express = require("express")
const cors = require("cors")
const {join} = require("path")
const listEndpoints = require("express-list-endpoints")

const movieRouter = require('./services/Media')
const reviewRouter = require('./services/reviews')

const server = express()
const port = process.env.PORT

server.use(cors())
server.use("/movies", movieRouter)
server.use("/reviews", reviewRouter)
console.log(listEndpoints(server))

server.listen(port, () => {
    console.log("Running on port", port)
  })
  