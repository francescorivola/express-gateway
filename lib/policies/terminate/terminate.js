module.exports = (params) =>
  (req, res) =>
    res.status(params.statusCode).send(params.message);
