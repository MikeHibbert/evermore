#include "mainsettingswindow.h"
#include "ui_mainsettingswindow.h"

MainSettingsWindow::MainSettingsWindow(QWidget *parent) :
    QMainWindow(parent),
    ui(new Ui::MainSettingsWindow)
{
    ui->setupUi(this);
}

MainSettingsWindow::~MainSettingsWindow()
{
    delete ui;
}
