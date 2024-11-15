/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

const mongoose = require('mongoose');
mongoose.connect(process.env.DB);

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  commentcount: { type: Number, required: true, min: 0 },
  comments: Array
});

const Book = mongoose.model('Book', bookSchema);

module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      (async () => {
        try {
          return await Book.find();
        }
        catch (err) {
          console.log('Error finding book documents:', err);
        }
      })().then(books => {
        res.json(books);
      });
      
    })
    
    .post(function (req, res){
      let title = req.body.title;
      //response will contain new book object including atleast _id and title
      if (!title) {
        res.send('missing required field title');
      } else {
        (async () => {
          try {
            return await Book.create({
              title: title,
              commentcount: 0
            })
          }
          catch (err) {
            console.error('Error creating book document:', err);
          }
        })().then(book => {
          res.json({
            _id: book._id,
            title: book.title
          });
        });
      }
    })
    
    .delete(function(req, res){
      //if successful response will be 'complete delete successful'
      (async () => {
        try {
          return await Book.deleteMany({});
        }
        catch (err) {
          console.error(err);
        }
      })().then(deleteResult => {
        if (deleteResult.deletedCount) {
          res.send('complete delete successful');
        }
      });
    });



  app.route('/api/books/:id')
    .get(function (req, res){
      let bookid = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      (async () => {
        try {
          return await Book.findOne({ _id: bookid })
        }
        catch (err) {
          console.error(err);
        }
      })().then(book => {
        if (book) {
          res.json(book);
        } else {
          res.send('no book exists');
        }
      });
    })
    
    .post(function(req, res){
      let bookid = req.params.id;
      let comment = req.body.comment;
      //json res format same as .get
      if (!comment) {
        res.send('missing required field comment');
      } else {
        (async () => {
          try {
            return await Book.findByIdAndUpdate(
              bookid,
              { 
                $push: { comments: comment }, 
                $inc: { commentcount: 1 } 
              },
              { new: true, useFindAndModify: false }
            );
          }
          catch (err) {
            console.error(err);
          }
        })().then(book => {
          if (book) {
            res.json(book);
          } else {
            res.send('no book exists');
          }
        });
      }

    })
    
    .delete(function(req, res){
      let bookid = req.params.id;
      //if successful response will be 'delete successful'
      (async () => {
        try {
          return await Book.findByIdAndDelete(bookid);
        }
        catch (err) {
          console.error(err);
        }
      })().then(deletedBook => {
        if (deletedBook) {
          res.send('delete successful');
        } else {
          res.send('no book exists');
        }
      });
    });
  
};
