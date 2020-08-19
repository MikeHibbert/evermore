import {
QKeySequence,
QApplication,
QMainWindow,
QMenu,
QIcon,
QSystemTrayIcon,
QAction
} from "@nodegui/nodegui";
import path from "path";
import { Dock } from "@nodegui/os-utils";
const icon = require("../assets/nodegui_white.png");
import Logo from './logo';

const win = new QMainWindow();
const trayIcon = new QIcon(path.resolve(__dirname, Logo));
const tray = new QSystemTrayIcon();
tray.setIcon(trayIcon);
tray.show();
tray.setToolTip("Evermore");

const menu = new QMenu();
tray.setContextMenu(menu);

// -------------------
// Quit Action
// -------------------
const shutdownAction = new QAction();
shutdownAction.setText("Shutdown Evermore");
shutdownAction.setIcon(trayIcon);
shutdownAction.addEventListener("triggered", () => {
const app = QApplication.instance();
    app.exit(0);
});

// -------------------
// Action with Submenu
// -------------------
const actionWithSubmenu = new QAction();
const subMenu = new QMenu();
const hideDockAction = new QAction();
hideDockAction.setText("hide");
hideDockAction.addEventListener("triggered", () => {
    Dock.hide();
});
//-----
const showDockAction = new QAction();
showDockAction.setText("show");
showDockAction.addEventListener("triggered", () => {
    Dock.show();
});
//-----
subMenu.addAction(hideDockAction);
subMenu.addAction(showDockAction);
actionWithSubmenu.setMenu(subMenu);
actionWithSubmenu.setText("Mac Dock");

// ----------------
// Dock Hide/Show
// ----------------
const balanceAction = new QAction();
balanceAction.setText("hide window");
balanceAction.setShortcut(new QKeySequence("Alt+H"));
balanceAction.addEventListener("triggered", () => {
    win.hide();
});
//-----
const showSettings = new QAction();
showSettings.setText("Settings");
showSettings.addEventListener("triggered", () => {
    win.show();
});

// ----------------------
// Add everything to menu
// ----------------------
menu.addAction(balanceAction);
menu.addAction(showSettings);
menu.addAction(actionWithSubmenu);
menu.addAction(shutdownAction);

win.setWindowTitle("NodeGUI Demo");
win.resize(400, 700);
win.show();

const qApp = QApplication.instance();
qApp.setQuitOnLastWindowClosed(false); // required so that app doesnt close if we close all windows.

global.win = win; // To prevent win from being garbage collected.
global.systemTray = tray; // To prevent system tray from being garbage collected.

const initSystemTray = () => { }

export default initSystemTray;

export const openWebclient = () => {
    var url = 'https://evermoredata.store/';
    var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
    require('child_process').exec(start + ' ' + url);
}