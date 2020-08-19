#include "mainsettingswindow.h"
#include <QApplication>

int main(int argc, char *argv[])
{
    QApplication a(argc, argv);
    MainSettingsWindow w;
    w.show();

    return a.exec();
}
