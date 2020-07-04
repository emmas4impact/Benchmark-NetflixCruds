const express = require("express");
const { join } = require("path");
const path = require("path");
const axios = require("axios");
const movieRouter = express.Router();
const uniqid= require("uniqid");
const { readDB, writeDB } = require("../../utilities");
const fs = require("fs-extra");
const PdfPrinter = require("pdfmake")
const pump = require("pump")
const sgMail = require("@sendgrid/mail");
const moviePathFolder =path.join(__dirname, "movies.json")

movieRouter.get('/', async(req, res, next)=>{
    try {
        const MovieDb = await readDB(moviePathFolder)
        
        res.send(MovieDb)
        
    } catch (error) {
        res.send(error) 
    }
    
})

movieRouter.get('/:id', async(req, res, next)=>{
    try {
        const MovieDb = await readDB(moviePathFolder)
        
        const movie = MovieDb.find((m)=>m.imdbId===req.params.id)
        
        if(movie){
            res.send(movie)
        }else{
            const error = new Error()
            error.httpStatusCode = 404
            next(error)
        }
    } catch (error) {
       res.send(error) 
       next("While reading movie list a problem occurred!")
    }
    
})

movieRouter.get('/:id/review', async(req, res, next)=>{
    const reviewPathFolder =path.join(__dirname, '../reviews/reviews.json')
    console.log(reviewPathFolder)
    try {
        const MovieDb = await readDB(moviePathFolder)
        const reviewDB = await readDB( reviewPathFolder)
        const reviewId = reviewDB.find((m)=>m.id===req.params.id)
        
        if(reviewId){
            
            res.send(reviewId)
        }else{
            const error = new Error()
            error.httpStatusCode = 404
            next(error)
        }
    } catch (error) {
       res.send(error) 
       next("While reading movie list a problem occurred!")
    }
    
})


movieRouter.post('/:Id', async(req, res, next)=>{
    try {
        const MoiveDb = await readDB(moviePathFolder)
        const { Id } = req.params
        let newMovie = {}
        if (Id) {
            const response = await axios.get(
              "http://www.omdbapi.com/?apikey=f2f0ec42&i="+ Id);
            console.log(response)
            newMovie = {
                Title: response.data.Title, 
                Year: response.data.Year, 
                Poster: response.data.Poster,
                imdbId: response.data.imdbID,
                Type: response.data.Type
            }
            const imdbID = MoiveDb.filter(movie=>movie.imdbId===newMovie.imdbId)
            if(imdbID){
                res.send("Movie already in database")
            }else{
                MoiveDb.push(newMovie)
                await writeDB(moviePathFolder, MoiveDb)
                res.status(200).send("New Movie added!")
            }
           
          } else {
            next(new Error("Please give a movie imbdID"))
          }
    } catch (error) {
        next(error)
    }
    
})

movieRouter.post('/catalogues/:title', async(req, res, next)=>{
    try {
        function base64_encode(file) {
          var bitmap = fs.readFileSync(file);
          return new Buffer(bitmap).toString("base64");
        }
        
        const MoiveDb = await readDB(moviePathFolder)
        const { title } = req.params
        let newMovie = {}
        if (title ) {
            const response = await axios.get(
              "http://www.omdbapi.com/?apikey=f2f0ec42&t="+ title );
            console.log(response.data)
            newMovie = {
                Title: response.data.Title, 
                Year: response.data.Year, 
                Poster: response.data.Poster,
                imdbId: response.data.imdbID,
                Type: response.data.Type
            }
            
                MoiveDb.push(newMovie)
                await writeDB(moviePathFolder, MoiveDb)
                res.status(200).send("New Movie added!")
                console.log(newMovie)
                
                var fonts ={
                    Roboto:{
                      normal:"fonts/Roboto-Regular.ttf",
                    }
                  }
                  var printer = new PdfPrinter(fonts);
                  const docDefinition ={
                    content:[
                      (Title= "Title: " + newMovie.Title),
                      (Year= "Year: " + newMovie.Year),
                      (Poster= "Poster: " + newMovie.Poster),
                      (imdbId= "imdb: " + newMovie.imdbId),
                      (Type= "type: " + newMovie.Type)
                      
                    ]
                  }
                  var pdfDoc =printer.createPdfKitDocument(docDefinition)
                  pdfDoc.pipe(fs.createWriteStream(path.join(__dirname, `../pdfs/${newMovie.Title}.pdf`)))
                  pdfDoc.end();
                  
                  
                  
                  //attachment
                  pathToAttachment =path.join(__dirname, `../pdfs/${newMovie.Title}.pdf`)
                  console.log(pathToAttachment)
                  fs.readFile(pathToAttachment, async function(err, data){
                    if(data){
                      sgMail.setApiKey(process.env.SENDGRID_API_KEY)
                      const data_64 = base64_encode(pathToAttachment)
                      
                      const msg ={
                        to: "emmans4destiny@gmail.com",
                        from: "strive@school.org",
                        subject: "Welcome!!",
                        text: "Please seat down and enjoy your movie!",
                        
                        attachments:[{
                          content: data_64,
                          filename: newMovie.Title,
                          type: "application/pdf"
                          
                          
                        },
                          
                        ],
                      };
                      sgMail.send(msg)
                      .then((response)=>{
                        res.send("suceess")
                        
                      }).catch((err)=>{
                        res.send(err)
                      })
                    }
                    //sgMail.send(msg)
                    
                  })
            
           
          } else {
            next(new Error("Please give a movie imbdID"))
          }
        
        
         
          
        
        } catch (error) {
          console.log(error)
          const err = new Error("While reading attendee list a problem occurred!")
          next(err)
        }
})
movieRouter.put('/:id', async(req, res, next)=>{
    try {
        const MoiveDb = await readDB(moviePathFolder)
        const movie = MoiveDb.find(m => m.imdbId === req.params.id)
        
        if(movie){
            const position = MoiveDb.indexOf(movie)
            const updatedMovie ={...req.body, ...movie}
            MoiveDb[position]= updatedMovie
            await writeDB(moviePathFolder, MoiveDb)
            res.status(200).send("Updated")
        }else{
            const error = new Error(`Movie with imdbId ${req.params.id} not found`)
            error.httpStatusCode = 404
            next(error)  
        }
    } catch (error) {
        next(error)
    }
    
})

movieRouter.delete('/:id', async(req, res, next)=>{
    try {
        const MoiveDb = await readDB(moviePathFolder)
        const movie = MoiveDb.find((m) => m.imdbId === req.params.id)
        if (movie) {
          await writeDB(
            moviePathFolder,
            MoiveDb.filter((x) => x.imdbId !== req.params.id)
          )
          res.send("Movie Deleted")
        } else {
          const error = new Error(`movie with asin ${req.params.id} not found`)
          error.httpStatusCode = 404
          next(error)
        }
      } catch (error) {
        next(error)
      }
    
})

module.exports=movieRouter;