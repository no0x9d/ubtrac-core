"use strict";
const TaskRepository = require('./task-repository').TaskRepository;
const {InvalidArgumentError} = require('./error/invalid-argument-error');

module.exports = function Utrac(db) {
  if (!db) throw new InvalidArgumentError('db must exist');
  return {
    taskRepository: new TaskRepository(db.collection('task'))
  }
};

