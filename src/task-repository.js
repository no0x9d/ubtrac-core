"use strict";
const Promise = require('bluebird');
const {InvalidArgumentError} = require('./error/invalid-argument-error');

class TaskRepository {
  constructor(collection) {
    this.collection = collection;
  }

  create(opts) {
    return new Promise((resolve, reject) => {
      if (!this.collection) return reject(new InvalidArgumentError('collection must exist', 'collection'));
      if (!opts.title) return reject(new InvalidArgumentError('opts must contain title field', 'title'));

      this.collection.insert(opts, (err, task)=> {
        if (err) return reject(err);
        resolve(task[0]);
      })
    });
  };

  findAll() {
    return new Promise((resolve, reject) => {
      if (!this.collection) return reject(new InvalidArgumentError('collection must exist', 'collection'));

      this.collection.find({}).toArray((err, tasks) => {
        if (err) return reject(err);
        resolve(tasks);
      })
    });
  }
}

module.exports.TaskRepository = TaskRepository;