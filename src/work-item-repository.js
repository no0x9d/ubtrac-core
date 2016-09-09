const Promise = require('bluebird');
const moment = require('moment');
const {InvalidArgumentError} = require('./error/invalid-argument-error');

class NoWorkItemFoundError extends Error {
}
class OverlappingTaskError extends Error {
  constructor(message, task, conflictingTasks) {
    this.message = message;
    this.task = task;
    this.conflictingTasks = conflictingTasks;
  }
}

module.exports.NoWorkItemFoundError = NoWorkItemFoundError;

module.exports.WorkItemRepository = class WorkItemRepository {
  constructor(collection, defaultTaskId) {
    this.collection = collection;
    this.defaultTaskId = defaultTaskId;
    Promise.promisifyAll(collection);
  }

  create(item = {}, options = {}) {
    let workItem = Object.assign({}, item);
    if (!workItem.start) workItem.start = new Date();
    if (!workItem.taskId) workItem.taskId = this.defaultTaskId;

    return this.findRunning()
      .then(w => {
        if (!w) return;
        if (w && !options.stopRunning) {
          throw new Error("There is a current running work log item and the 'stopRunning option is not set'")
        }
        return this.updateById(w._id, {end: workItem.start})
      })
      .then(() => this.validateOverlappingTimes(workItem, {}, options))
      .then(() => this.collection.insertAsync(workItem))
      .then(items => items[0])
  }

  updateById(id, changes, options = {}) {
    return this.findById(id)
      .then(task => this.validateOverlappingTimes(changes, task, options))
      .then(()=> this.collection.updateAsync({_id: id}, {$set: changes}))
  }

  deleteById(id) {
    if (!this.collection) return Promise.reject(new InvalidArgumentError('collection must exist', 'collection'));
    return this.collection.removeAsync({_id: id});
  }

  findById(id) {
    return this.collection.findOneAsync({_id: id})
      .then(workitem => {
        if (!workitem) throw new NoWorkItemFoundError('could not find item with id ' + id);
        return workitem;
      })
  }

  findByTaskId(taskId) {
    return this.find({taskId: taskId});
  }

  findAll(options) {
    return this.find({});
  }

  findByTime(from, to) {
    if (!from && !to) {
      return Promise.reject(new InvalidArgumentError("'from' and/or 'to' parameters must be provided"))
    }

    const conditions = [];
    if (from) {
      conditions.push({start: {$gt: from}})
    }
    if (to) {
      conditions.push({start: {$lt: to}})
    }

    const query = {$and: conditions};
    return this.find(query)
  }

  find(query) {
    return new Promise((resolve, reject) => {
      if (!this.collection) return reject(new InvalidArgumentError('collection must exist', 'collection'));
      this.collection.find(query).toArray((err, tasks) => {
        if (err) return reject(err);
        resolve(tasks);
      })
    });
  }

  findRunning() {
    return this.collection.findOneAsync({end: {$exists: false}})
  }

  validateOverlappingTimes(changes, task, options) {
    // remove illegal null values for start and end
    ['start', 'end'].forEach(prop => {
      if (changes.hasOwnProperty(prop) && changes[prop] == null) {
        delete changes[prop];
      }
    });

    if (changes.start || changes.end) {
      const startMoment = (changes.start && moment(changes.start)) || moment(task.start);
      const endMoment = (changes.end && moment(changes.end)) || (task.end && moment(task.end)) || moment();

      if (startMoment.isAfter(endMoment)) {
        throw Error(`start date is after end date. ${startMoment.format()} ${endMoment.format()}`);
      }
      var conflictQuery = createQueryForTimeOverlapping(startMoment, endMoment);
      //exclude current work item from query
      if (task && task._id) {
        conflictQuery._id = {$ne: task._id};
      }

      return this.find(conflictQuery)
        .then(tasks => {
          var completeOverlap = tasks.filter(t => {
            const start = moment(t.start);
            const end = moment(t.end);
            return start.isBefore(startMoment) && end.isAfter(endMoment)
              || start.isAfter(startMoment) && end.isBefore(endMoment);
          });

          var startOverlap = tasks.filter(t => {
            return moment(t.start).isBefore(startMoment) && moment(t.end).isAfter(startMoment);
          });
          var endOverlap = tasks.filter(t => {
            return moment(t.end).isBefore(endMoment) && moment(t.end).isAfter(endMoment);
          });

          if (completeOverlap.length > 0 || startOverlap.length > 1 || endOverlap.length > 1) {
            throw new OverlappingTaskError(
              'Fatal error while editing! To many overlapping work items for this edit can not be resolved',
              task);
          }

          const subEdits = [];
          if ((startOverlap.length === 1 || endOverlap.length === 1)) {
            if (options.autoresolve) {
              if (startOverlap.length === 1) {
                subEdits.push(this.updateById(startOverlap[0]._id, {end: startMoment.toDate()}));
              }
              if (endOverlap.length === 1) {
                subEdits.push(this.updateById(endOverlap[0]._id, {start: endMoment.toDate()}));
              }
            } else {
              throw new OverlappingTaskError('Error while editing! There are overlapping tasks. ' +
                'Please update conflicting tasks first or use the option autoresolve.',
                task);
            }
          }
          return Promise.all(subEdits);
        })
    }
  }
};


//------ Util functions ------------------------
function createQueryForTimeOverlapping(startMoment, endMoment) {
  var queryStart = {
    $and: [
      {start: {$lt: startMoment.toDate()}},
      {end: {$gt: startMoment.toDate()}}
    ]
  };
  var queryEnd = {
    $and: [
      {start: {$lt: endMoment.toDate()}},
      {end: {$gt: endMoment.toDate()}}
    ]
  };
  var queryMiddle = {
    $and: [
      {start: {$gte: startMoment.toDate()}},
      {end: {$lte: endMoment.toDate()}}
    ]
  };
  return {
    $or: [
      queryStart,
      queryMiddle,
      queryEnd
    ]
  };
}