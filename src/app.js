const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// No helmet, no security headers, no CORS policy — intentional
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const usersRouter = require('./routes/users');
const tasksRouter = require('./routes/tasks');
const authRouter  = require('./routes/auth');
const utilsRouter = require('./routes/utils');

app.use('/users', usersRouter);
app.use('/tasks', tasksRouter);
app.use('/auth',  authRouter);
app.use('/',      utilsRouter);

// No global error handling middleware — each route fends for itself
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
