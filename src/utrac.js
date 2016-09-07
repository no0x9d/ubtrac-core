"use strict";
const TaskRepository = require('./task-repository').TaskRepository;
const WorkLogRepository = require('./work-item-repository').WorkItemRepository;
const {InvalidArgumentError} = require('./error/invalid-argument-error');

module.exports = function Utrac(db) {
  if (!db) throw new InvalidArgumentError('db must exist');
  return {
    taskRepository: new TaskRepository(db.collection('task')),
    workLogRepository: new WorkLogRepository(db.collection('worklog'))
  };
};

