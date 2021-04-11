const MyApplication = require('./classes/application');
const routes = require('./routes');

const app = new MyApplication();

routes(app);

app.ready(3000);
