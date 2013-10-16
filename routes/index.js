
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('blog/index.tpl', { title: 'Express' });
};