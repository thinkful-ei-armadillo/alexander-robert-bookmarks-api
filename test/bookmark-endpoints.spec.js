const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const BookmarksService = require('../src/bookmarks/bookmarks-service');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe('Bookmark Endpoints', () => {
  let db;
  let testBookmarks = makeBookmarksArray();

  before('establish connection to database',() => {
    db = knex({
      client: 'pg',
      connection: process.env.DB_URL_TEST
    });
    app.set('db', db);
  });
  before('clean the table',() => db('bookmarks').truncate());
  afterEach('maid service', () => db('bookmarks').truncate());
  after('end connection', () => db.destroy());

  context(`Given 'bookmarks' has data`, () => {
    beforeEach(() => {
      return db.into('bookmarks').insert(testBookmarks);
    });
    it(`'getAllBookmarks()' resolves all bookmarks from 'bookmarks' table`, () => {
      // return BookmarksService.getAllBookmarks(db).then(actual => {
      //   expect(actual).to.eql(testBookmarks);
      // });
      return supertest(app)
        .get('/bookmarks')
        .expect(200, testBookmarks)
    });
    it(`'getBookmarkById()' resolves an article by ID from 'bookmarks' table`, () => {
      const id = 3;
      const testBookmark = testBookmarks[id-1];
      return BookmarksService.getBoomarkById(db, id).then(actual => {
        expect(actual).to.eql(testBookmark);
      });
    });
    it(`'updateBookmark()' resolves with an updated article by ID from 'bookmarks' table`, () => {
      const id = 3;
      const originalBookmark = testBookmarks[id-1];
      const newBookmarkFields = {
        title: 'Updated Title'
      };
      return BookmarksService.updateBookmark(db, id, newBookmarkFields).then(actual => {
        expect(actual).to.eql({
          ...originalBookmark,
          ...newBookmarkFields
        });
      });
    });
    it(`'deleteBookmark' resolves with a deleted article by ID from 'bookmarks' table`, () => {
      const id = 1;
      const updatedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== id);
      return BookmarksService.deleteBookmark(db, id)
        .then(() => BookmarksService.getAllBookmarks(db))
        .then((allBookmarks) => {
          expect(allBookmarks).to.eql(updatedBookmarks)
        });
    });
  });
  context('given bookmarks has no data', () => {
    it(`'getAllBookmarks' resolves an empty array from 'bookmarks' table`, () => {
      return BookmarksService.getAllBookmarks(db)
        .then((actual) => {expect(actual).to.eql([])});
    });
    it(`'insertBookmark' resolves with an updated array of bookmarks`, () => {
      const newBookmark = testBookmarks[0];
      return BookmarksService.insertBookmark(db, newBookmark)
        .then(() => {
          return BookmarksService.getAllBookmarks(db)
        })
        .then((allBookmarks) => {
          expect(allBookmarks).lengthOf(1);
        });
    });
    it(`'findBookmarkById' resolves with a 404 given an invalid id` , () => {
      return supertest(app)
        .get('/bookmarks/5')
        .expect(404, 'Bookmark not found.');
    });
  });
});