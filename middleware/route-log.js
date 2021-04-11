
function routeLog(req, res, next) {
  const method = req.method;
  const path = req.path;

  console.log(`${new Date().toISOString()} | HTTP | ${method} ${path}`);

  next();
}

module.exports = routeLog