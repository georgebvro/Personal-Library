/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       
*/

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { create } = require('mocha/lib/suite');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  /*
  * ----[EXAMPLE TEST]----
  * Each test should completely test the response of the API end-point including response status code!
  */
  test('#example Test GET /api/books', function(done){
     chai.request(server)
      .get('/api/books')
      .end(function(err, res){
        assert.equal(res.status, 200);
        assert.isArray(res.body, 'response should be an array');
        assert.property(res.body[0], 'commentcount', 'Books in array should contain commentcount');
        assert.property(res.body[0], 'title', 'Books in array should contain title');
        assert.property(res.body[0], '_id', 'Books in array should contain _id');
        done();
      });
  });
  /*
  * ----[END of EXAMPLE TEST]----
  */

  suite('Routing tests', function() {


    suite('POST /api/books with title => create book object/expect book object', function() {
      
      test('Test POST /api/books with title', function(done) {
        chai.request(server)
        .post('/api/books')
        .set('content-type', 'application/json')
        .send({ title: 'Book with title created by AT' })
        .end((err, res) => {
          assert.equal(res.status, 200, 'Failure creating a book with title (wrong response status).');
          assert.exists(res.body._id, 'Failure creating a book with title (missing book id).');
          assert.equal(res.body.title, 'Book with title created by AT', 'Failure creating a book with title (wrong book title).');
          done();
        });
      });
      
      test('Test POST /api/books with no title given', function(done) {
        chai.request(server)
        .post('/api/books/')
        .set('content-type', 'application/json')
        .send({ title: '' })
        .end((err, res) =>{
          assert.equal(res.status, 200, 'Failure creating a book with no title (wrong response status).');
          assert.equal(res.text, 'missing required field title', 'Failure creating a book with no title (wrong response text)');
          assert.equal(JSON.stringify(res.body), '{}', 'Failure creating a book with no title (response body sohuld be empty object).');
          done();
        });
      });
    });


    suite('GET /api/books => array of books', function(){
      
      test('Test GET /api/books',  function(done){
        chai.request(server)
        .get('/api/books')
        .end((err, res) => {
          res.body.forEach(book => {
            assert.equal(res.status, 200, 'Failure getting all books (wrong response status');
            assert.isArray(res.body, 'Failure getting all books in an Array.');
            assert.property(book, '_id', 'Failure getting all books (missing _id property).');
            assert.property(book, 'title', 'Failure getting all books (missing title property).');
            assert.property(book, 'commentcount', 'Failure getting all books (missing commentcount property).');
          });
          done();
        });
      });      
      
    });


    suite('GET /api/books/[id] => book object with [id]', function(){
      
      test('Test GET /api/books/[id] with id not in db',  function(done){
        chai.request(server)
        .get('/api/books/000000000000000000000000')
        .end((err, res) => {
          assert.equal(res.status, 200, 'Failure trying to get a book with id not in database (wrong response status).');
          assert.equal(res.text, 'no book exists', 'Failure getting proper response for trying to get a book with id not in database.');
          done();
        });
      });
      
      test('Test GET /api/books/[id] with valid id in db',  function(done){
        chai.request(server)
        .post('/api/books')
        .set('content-type', 'application/json')
        .send({ title: 'Book created by AT for testing getting book by valid id'})
        .end((err, postRes) => {
          chai.request(server)
          .get('/api/books/' + postRes.body._id)
          .end((err, getRes) => {
            assert.equal(getRes.status, 200, 'Failure getting book with existing id (wrong response status).');
            assert.equal(getRes.body._id, postRes.body._id, 'Failure getting book with existing id (wrong _id).');
            assert.equal(getRes.body.title, 'Book created by AT for testing getting book by valid id', 'Failure getting book with existing id (wrong title).');
            done();
          });
        });
      });
      
    });


    suite('POST /api/books/[id] => add comment/expect book object with id', function(){
      
      test('Test POST /api/books/[id] with comment', function(done){
        chai.request(server)
        .post('/api/books')
        .set('content-type', 'application/json')
        .send({ title: 'Book created by AT for testing comments' })
        .end((err, createBookRes) => {
          chai.request(server)
          .get('/api/books/' + createBookRes.body._id)
          .end((err, getBookRes) => {
            chai.request(server)
            .post('/api/books/' + createBookRes.body._id)
            .type('form')
            .send({
              comment: 'Comment 1'
            })
            .end((err, updateBookRes) => {
              assert.equal(updateBookRes.status, 200, 'Failure posting comment on book (wrong response status).');
              assert.equal(updateBookRes.body._id, createBookRes.body._id, 'Failure posting comment on book (wrong _id returned).');
              assert.equal(updateBookRes.body.title, createBookRes.body.title, 'Failure posting comment on book (wrong title returned).');
              assert.equal(updateBookRes.body.commentcount, getBookRes.body.commentcount + 1, 'Failure posting comment on book (wrong comment count).');
              chai.request(server)
              .post('/api/books/' + createBookRes.body._id)
              .set('content-type', 'application/json')
              .send({ comment: 'Comment 2' })
              .end((err, updateBookRes2) => {
                assert.equal(updateBookRes2.body.commentcount, updateBookRes.body.commentcount + 1, 'Failure posting comment on book (wrong comment count).');
                assert.equal(updateBookRes2.body.comments[0], 'Comment 1', 'Failure posting comment on book (wrong comment value).');
                assert.equal(updateBookRes2.body.comments[1], 'Comment 2', 'Failure posting comment on book (wrong comment value).');
                done();
              });
            });
          });
        });
      });

      test('Test POST /api/books/[id] without comment field', function(done){
        chai.request(server)
        .post('/api/books')
        .set('content-type', 'application/json')
        .send({ title: 'Book created by AT for trying updating book without comment' })
        .end((err, createBookRes) => {
          chai.request(server)
          .post('/api/books/' + createBookRes.body._id)
          .set('content-type', 'application/json')
          .send({ })
          .end((err, updateBookRes) => {
            assert.equal(updateBookRes.status, 200, 'Failure posting comment on book (wrong response status).');
            assert.equal(updateBookRes.text, 'missing required field comment', 'Failure getting proper response for trying to update a book without sending comment.');
            done();
          });
        });
      });

      test('Test POST /api/books/[id] with comment, id not in db', function(done){
        chai.request(server)
        .post('/api/books/000000000000000000000000')
        .set('content-type', 'application/json')
        .send({ comment: 'Comment' })
        .end((err, res) => {
          assert.equal(res.status, 200, 'Failure posting comment on inexistent book (wrong response status).');
          assert.equal(res.text, 'no book exists', 'Failure getting proper response for trying to update an inexistent book.');
          done();
        });
      });
    });

    suite('DELETE /api/books/[id] => delete book object id', function() {

      test('Test DELETE /api/books/[id] with valid id in db', function(done){
        chai.request(server)
        .post('/api/books')
        .set('content-type', 'application/json')
        .send({ title: 'Book created by AT to later delete it.' })
        .end((err, createBookRes) => {
          chai.request(server)
          .del('/api/books/' + createBookRes.body._id)
          .end((err, deleteBookRes) => {
            assert.equal(deleteBookRes.status, 200, 'Failure deleting book (wrong response status).');
            assert.equal(deleteBookRes.text, 'delete successful', 'Failure getting proper response when deleting a book.');
            done();
          });
        });
      });

      test('Test DELETE /api/books/[id] with id not in db', function(done){
        chai.request(server)
        .del('/api/books/000000000000000000000000')
        .end((err, res) => {
          assert.equal(res.status, 200, 'Failure deleting inexesting book (wrong response status).');
          assert.equal(res.text, 'no book exists', 'Failure getting proper response when trying deleting inexisting book.');
          done();
        });
      });
    });

  });

});
