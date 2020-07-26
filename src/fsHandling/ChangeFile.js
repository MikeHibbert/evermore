const notifier = require('node-notifier');

const fileChangedHandler = (path) => {
    console.log(`File ${path} has been changed`)

    notifier.notify({
        title: 'Evermore Datastore',
        message: `${path} was changed and has been addded to the upload queue`
      });
}

export default fileChangedHandler;