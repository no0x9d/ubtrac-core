"use strict";
const Promise = require('bluebird');
const {InvalidArgumentError} = require('./error/invalid-argument-error');
const forOwn = require('lodash.forown');

class TaskRepository {
  constructor(collection) {
    this.collection = collection;
  }

  create(opts) {
    let task = Object.assign({}, opts);
    return new Promise((resolve, reject) => {
      if (!this.collection) return reject(new InvalidArgumentError('collection must exist', 'collection'));
      if (!task.title) return reject(new InvalidArgumentError('task must contain title field', 'title'));

      if (!task.state) task.state = 'open';
      if (!task.archived) task.archived = false;
      task.created = task.lastModified = new Date();

      this.collection.insert(task, (err, task)=> {
        if (err) return reject(err);
        resolve(task[0]);
      })
    });
  };

  updateById(id, opts) {
    return new Promise((resolve, reject) => {
      if (!this.collection) return reject(new InvalidArgumentError('collection must exist', 'collection'));

      let extendedOpts = Object.assign({}, opts);
      extendedOpts.lastModified = new Date();

      const changes = buildUpdateOperations(extendedOpts);

      this.collection.update({_id: id}, changes, (err) => {
        if (err) return reject(err);
        resolve(this.findById(id))
      })
    });
  }

  findById(id) {
    return new Promise((resolve, reject) => {
      if (!this.collection) return reject(new InvalidArgumentError('collection must exist', 'collection'));

      this.collection.findOne({_id: id}, (err, tasks) => {
        if (err) return reject(err);
        resolve(tasks);
      });
    });
  }

  findAll(inclArchived = false) {
    return new Promise((resolve, reject) => {
      if (!this.collection) return reject(new InvalidArgumentError('collection must exist', 'collection'));

      var query = inclArchived ? {} : {archived: false};
      this.collection.find(query).toArray((err, tasks) => {
        if (err) return reject(err);
        resolve(tasks);
      })
    });
  }

  deleteById(id){
    return new Promise((resolve, reject) => {
      if (!this.collection) return reject(new InvalidArgumentError('collection must exist', 'collection'));

      this.collection.remove({_id: id}, (err) => {
        if (err) return reject(err);
        resolve();
      })
    });
  }
}

function buildUpdateOperations(fields) {
  const changes = {
    $set: {},
    $unset: {}
  };
  forOwn(fields, (value, key) => {
    if (value == undefined) {
      changes.$unset[key] = true;
    } else {
      changes.$set[key] = value;
    }
  });

  return changes;
}

module.exports.TaskRepository = TaskRepository;