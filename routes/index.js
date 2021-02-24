var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // Set home nav menù active
  
  res.render('index', { title: 'Express', active: {home:true}});
});

module.exports = router;
