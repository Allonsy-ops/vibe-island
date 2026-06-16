const { app } = require('electron');
const { bootstrapApp } = require('./src/main/app-controller');

app.whenReady().then(() => {
  bootstrapApp({ app });
});
