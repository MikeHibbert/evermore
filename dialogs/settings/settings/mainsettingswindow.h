#ifndef MAINSETTINGSWINDOW_H
#define MAINSETTINGSWINDOW_H

#include <QMainWindow>

namespace Ui {
class MainSettingsWindow;
}

class MainSettingsWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainSettingsWindow(QWidget *parent = nullptr);
    ~MainSettingsWindow();

private:
    Ui::MainSettingsWindow *ui;
};

#endif // MAINSETTINGSWINDOW_H
