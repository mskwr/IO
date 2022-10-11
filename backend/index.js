const { app, session } = require('./app');
const sock = require('./sockets/server');

app.setup().then(() => {
  // set port, listen for requests
  const PORT = process.env.PORT || 4080;
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });

  sock.launch(server, session, app.database);
})