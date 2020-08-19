const { QMainWindow, QLabel, WidgetEventTypes} = require("@nodegui/nodegui");



const openSettingsDialog = () => {
    console.log("Settings Dialog Opened");

    const win = new QMainWindow();
    win.setWindowTitle("Evermore Settings");

    const label = new QLabel(win);
    label.setText("Root Folder: Root Folder:Root Folder:Root Folder:Root Folder:Root Folder:Root Folder:");

    win.addEventListener(WidgetEventTypes.Close, function(e) {
        return null;
    });

    win.show();

    global.win = win;
}

export default openSettingsDialog;