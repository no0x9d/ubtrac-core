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

  it('should create tasks in state "open"', function(done) {
    this.taskRepository.create(getTaskOpts())
      .then(task => {
        expect(task).to.have.property('state', 'open');
        done()
      })
      .catch(done);
  });

  it('should create tasks with a visibility of visible', function(done) {
    this.taskRepository.create(getTaskOpts())
      .then(task => {
        expect(task).to.have.property('archived', false);
        done()
      })
      .catch(done);
  });

  it('should update a task', function(done) {
    const newTitle = 'newTitle';
    this.taskRepository.create(getTaskOpts())
      .then(task => {
        expect(task).to.have.property('title', getTaskOpts().title);
        task.title = newTitle;
        return this.taskRepository.updateById(task._id, task)
      })
      .then(task => {
        expect(task).to.have.property('title', newTitle);
        done()
      })
      .catch(done);
  });

  it('update should only change fields in opts', function(done) {
    this.taskRepository.create(getTaskOpts())
      .then(task => {
        return this.taskRepository.updateById(task._id, {archived: true})
      })
      .then(task => {
        expect(task).to.have.property('title', getTaskOpts().title);
        expect(task).to.have.property('archived', true);
        done()
      })
      .catch(done)
  });

  it('update should remove fields if set to undefined', function(done) {
    var extendedValues = {extended: 'awesome!'};
    this.taskRepository.create(Object.assign(extendedValues, getTaskOpts()))
      .then(task => {
        expect(task).to.have.property('extended', extendedValues.extended);
        return this.taskRepository.updateById(task._id, {extended: undefined})
      })
      .then(task => {
        expect(task).to.not.have.property('extended');
        done()
      })
      .catch(done);
  });
  
  it('should find an task by id', function(done) {
    this.taskRepository.create(getTaskOpts())
      .then(task => this.taskRepository.findById(task._id))
      .then(task => {
        expect(task).to.have.property('title', getTaskOpts().title);
        done()
      })
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
  });
  
  it('should delete a task with a given id', function(done) {
    var id;
    this.taskRepository.create(getTaskOpts())
      .then(t => id = t._id)
      .then(() => this.taskRepository.findById(id))
      .then(t => {
        expect(t).to.have.property('title', getTaskOpts().title);
        return this.taskRepository.deleteById(t._id);
      })
      .then(() => this.taskRepository.findById(id))
      .then(t => {
        expect(t).to.be.null;
        done();
      })
      .catch(done)
  })
});

function getTaskOpts() {
  return {title: 'test'}
}