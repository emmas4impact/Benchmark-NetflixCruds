const express = require("express")
const reviewRouter = express.Router();
const { check, validationResult, sanitizeBody } = require("express-validator")
const multer = require("multer")
const { join } = require("path");
const path = require("path");
const uniqid= require("uniqid");
const { readDB, writeDB } = require("../../utilities");
const fs = require("fs-extra");

const reviewPathFolder =path.join(__dirname, "reviews.json")
reviewRouter.get('/', async(req, res, next)=>{
    try {
        const reviewDb =await readDB(reviewPathFolder);
        res.send(reviewDb)
    } catch (error) {
       next(error) 
    }
})

reviewRouter.get('/:id', async(req, res, next)=>{
    try {
        
        const reviewDb = await readDB(reviewPathFolder)
        
        const review = reviewDb.find((m)=>m.id==req.params.id)
        
        if(review){
            res.send(review)
        }else{
            const error = new Error()
            error.httpStatusCode = 404
            next(error)
        }
        
    } catch (error) {
        next(error)
    }
    
})

reviewRouter.post('/',
[ check("comment").exists().withMessage("You should write a comment"),
check("elementId").exists(),
check("rate").exists().isNumeric(),],
 async(req, res, next)=>{
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const error = new Error()
      error.httpStatusCode = 400
      error.message = errors
      next(error)
    }
    try {
        const reviews = await readDB(reviewPathFolder)
        const newReview = {
            ...req.body, 
            id: uniqid(), 
            createdAt: new Date() };
        console.log(req.body)
        reviews.push(newReview)
        await writeDB(reviewPathFolder, reviews)
        
        res.status(201).send("New reviews Added")
        
    } catch (error) {
        next(error)
    }
})

reviewRouter.put('/:id', async(req, res, next)=>{
    try {
        const reviewDb = await readDB(reviewPathFolder)
        const review= reviewDb.find(r => r.id === req.params.id)
        
        if(review){
            const position = reviewDb.indexOf(review)
            const updatedreview ={ ...review, ...req.body}
            reviewDb[position]= updatedreview 
            await writeDB(reviewPathFolder, reviewDb)
            res.status(200).send("Review Updated")
        }else{
            const error = new Error(`Movie with imdbId ${req.params.id} not found`)
            error.httpStatusCode = 404
            next(error)  
        }
        
        
    } catch (error) {
        next(error)
    }
    
    
})

reviewRouter.delete('/:id', async (req, res, next)=>{
    try {
        const reviews = await readDB(reviewPathFolder);
        const filterdReview = reviews.find((c)=> c.id===req.params.id)
        if(filterdReview){
          await writeDB(reviewPathFolder, reviews.filter((x) => x.id!== req.params.id))
          res.send("Deleted")
        }else{
          const error = new Error(`Book with asin ${req.params.id} not found`)
          error.httpStatusCode = 404
          next(error)
        } 
        
    } catch (error) {
        next(error)
    }
    
});

module.exports=reviewRouter
