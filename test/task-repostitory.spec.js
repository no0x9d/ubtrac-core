"use strict";
const TingoDb = require('tingodb');
const expect = require('./util').expect;
const {TaskRepository} = require('../src/task-repository');
const {InvalidArgumentError} = require('../src/error/invalid-argument-error');

const db = new new TingoDb({memStore: true}).Db('', {});

describe('The task repository', function() {
  beforeEach(function(done) {
    db.dropDatabase((err)=> {
      this.taskRepository = new TaskRepository(db.collection('task'));
      done(err)
    });
  });

  it('should create a task with an id', function(done) {
    this.taskRepository.create(getTaskOpts())
      .then(task => {
        expect(task).to.exist;
        expect(task).to.have.any.keys('_id');
        done();
      }).catch(done);
  });

  it('should only create tasks with a title', function(done) {
    this.taskRepository.create({})
      .catch(InvalidArgumentError, e => {
        expect(e.parameter).to.equal('title')
      })
      .then(() => this.taskRepository.create(getTaskOpts()))
      .then(task => {
        expect(task).to.have.property('title', getTaskOpts().title);
        done();
      }).catch(done)
  });

  it('should list all tasks', function(done) {
    this.taskRepository.create(getTaskOpts())
      .then(() => this.taskRepository.findAll())
      .then(tasks => {
        expect(tasks).to.have.lengthOf(1);
        done()
      })
      .catch(done)
  });

  it('should return an empty array if no tasks are found', function(done) {
    this.taskRepository.findAll()
      .then(tasks => {
        expect(tasks).to.have.lengthOf(0);
        done()
      })
      .catch(done)
  })
});

function getTaskOpts(){
  return {title: 'test'}
}