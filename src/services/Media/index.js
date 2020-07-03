const express = require("express");
const { join } = require("path");
const path = require("path");
const axios = require("axios");
const movieRouter = express.Router();
const uniqid= require("uniqid");
const { readDB, writeDB } = require("../../utilities");
const fs = require("fs-extra");

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