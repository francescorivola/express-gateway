const express = require("express");
const schemas = require("../../schemas");

module.exports = function () {
  const router = express.Router();

  router.get("/:param", function (req, res) {
    const { param } = req.params;
    res.json(schemas.find(param));
  });
  router.get("/", function (req, res) {
    res.json(schemas.find());
  });

  return router;
};
