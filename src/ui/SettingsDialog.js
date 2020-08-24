import {
    QMainWindow,
    QPushButton,
    QPushButtonSignals,
    QAbstractButtonSignals,
    QFileDialog,
    QTextEdit,
    QWidget,
    QKeyEvent,
    FlexLayout,
    QBoxLayout,
    QLabel,
    BaseWidgetEvents,
    NativeElement,
    FileMode
  } from "@nodegui/nodegui";

  import {walletFileSet} from '../db/helpers';
  import openConnectDialog from './ConnectDialog';

  const rootStyleSheet = `
  #rootView {
    margin: 10px;
  }

  #walletPathControls {
    flex-direction: row;
    
  }

  #walletFieldset {
    margin: 20px;
  }

  #walletPathLabel {
      font-weight: bold;
  }

  #walletPathText {
    margin-right: 5px;
  }

  #btnSelectWallet {
  }
`;

const openSettingsDialog = (win) => {
    const wallet_path = walletFileSet();

    if(!wallet_path) {
        openConnectDialog();
    } else {
        const rootView = new QWidget();
        rootView.setObjectName("rootView");
        const rootViewLayout = new FlexLayout()
        rootView.setLayout(rootViewLayout);

        const editable_settings = {
          changed: false,
          wallet_path:wallet_path
        }
        // wallet file path
        createWalletPathRow(editable_settings, rootView);
       

        rootView.setStyleSheet(rootStyleSheet);

        win.setCentralWidget(rootView);
        win.setWindowTitle("Evermore Settings");
        win.resize(800, 640);
        win.show();
    }

    
}

const createWalletPathRow = (editable_settings, rootView) => {

    // Fieldset
    const walletFieldset = new QWidget();
    const walletFieldsetLayout = new FlexLayout();
    walletFieldset.setObjectName('walletFieldset');
    walletFieldset.setLayout(walletFieldsetLayout);

    // label
    const walletPathLabel = new QLabel();
    walletPathLabel.setObjectName("walletPathLabel");
    walletPathLabel.setText("Wallet Location:");
    walletFieldsetLayout.addWidget(walletPathLabel);
    

    // path and select button
    const walletPathControls = new QWidget();
    const walletPathControlsLayout = new FlexLayout();
    walletPathControls.setObjectName('walletPathControls');
    walletPathControls.setLayout(walletPathControlsLayout);

    const walletPathText = new QLabel();
    walletPathText.setObjectName("walletPathText");
    walletPathText.setText(editable_settings.wallet_path);
    walletPathControlsLayout.addWidget(walletPathText);
    
    const btnSelectWallet = new QPushButton();
    btnSelectWallet.setText("Select Wallet");
    btnSelectWallet.setObjectName(`btnSelectWallet`);

    btnSelectWallet.addEventListener("clicked", () => {
        const fileDialog = new QFileDialog()
        fileDialog.setFileMode(FileMode.AnyFile);
        fileDialog.setNameFilter('AR Wallet (*.json)');
        fileDialog.exec();

        const selected_file = fileDialog.selectedFiles();

        if(selected_file.length > 0) {
          editable_settings.wallet_file = selected_file[0];
          editable_settings.changed = true;
        }        
    });
    walletPathControlsLayout.addWidget(btnSelectWallet);

    walletFieldsetLayout.addWidget(walletPathControls);    

    rootView.layout.addWidget(walletFieldset);
}

export default openSettingsDialog;