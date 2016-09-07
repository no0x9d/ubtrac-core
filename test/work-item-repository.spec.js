const TingoDb = require('tingodb');
const {WorkItemRepository, NoWorkItemFoundError} = require('../src/work-item-repository');
const expect = require('./util').expect;

const db = new new TingoDb({memStore: true}).Db('', {});

describe('The work items repository', () => {
  "use strict";
  const defaultTaskId = 42;
  beforeEach(function(done) {
    db.dropDatabase((err)=> {
      this.workItemRepository = new WorkItemRepository(db.collection('workitems'), defaultTaskId);
      done(err)
    })
  });

  describe('#create', function() {
    it('should start a work item', function(done) {
      return this.workItemRepository.create()
        .then(workitem => {
          expect(workitem).to.exist;
          done()
        })
        .catch(done);
    });

    it('should return the started work item with a starting time and an id', function(done) {
      return this.workItemRepository.create()
        .then(workitem => {
          expect(workitem.start).to.be.instanceOf(Date);
          done();
        })
        .catch(done)
    });

    it('should return the started work item with an id', function(done) {
      return this.workItemRepository.create()
        .then(workitem => {
          expect(workitem._id).to.exist;
          done()
        }).catch(done)
    });

    it('should take a starting time as parameter', function(done) {
      const startDate = new Date(2013, 4, 12);
      return this.workItemRepository.create({start: startDate})
        .then(workitem => {
          expect(workitem.start).to.equalDate(startDate);
          done();
        }).catch(done);
    });

    it('should have a default task id in the started work item', function(done) {
      return this.workItemRepository.create()
        .then(workitem => {
          expect(workitem.taskId).is.equal(defaultTaskId);
          done()
        }).catch(done);
    });

    it('should take a task id as parameter', function(done) {
      const taskId = 12345;
      return this.workItemRepository.create({taskId: taskId})
        .then(workitem => {
          expect(workitem.taskId).to.equal(taskId);
          done();
        }).catch(done);
    });
  });

  describe('#findRunning', function() {
    it('should resolve with null if calling findRunning and no work item is currently running', function(done) {
      this.workItemRepository.findRunning()
        .then(workitem =>{
          expect(workitem).to.be.null;
          done();
        })
        .catch(done);
    });

    it('should return the current running work item', function(done) {
      this.workItemRepository.create()
        .then(startedItem =>
          Promise.all([startedItem, this.workItemRepository.findRunning()]))
        .then(workitems => {
          expect(workitems[0]).to.deep.equal(workitems[1]);
          done();
        }).catch(e => done(e));

    });
  });
});
