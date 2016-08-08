class InvalidArgumentError extends Error {
  constructor(message, parameter) {
    super(message);
    this.name = this.constructor.name;
    this.parameter = parameter;
  }
}

module.exports.InvalidArgumentError = InvalidArgumentError;