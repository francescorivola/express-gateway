let data;
class Provider {
  constructor(options) {
    data = options;
  }
  on() {}
}

module.exports = function () {
  return Provider;
};

module.exports.getOptions = () => {
  return data;
};

module.exports.reset = () => {
  data = null;
};
