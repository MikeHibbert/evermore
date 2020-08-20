import {
    QMainWindow,
    QPushButton,
    QAbstractButtonSignals,
    QFileDialog,
    QTextEdit,
    QWidget,
    QKeyEvent,
    FlexLayout,
    QBoxLayout,
    QLabel,
    BaseWidgetEvents,
    NativeElement
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

        // wallet file path
        createWalletPathRow(wallet_path, rootView);
       

        rootView.setStyleSheet(rootStyleSheet);

        win.setCentralWidget(rootView);
        win.setWindowTitle("Evermore Settings");
        win.resize(800, 640);
        win.show();
    }

    
}

const createWalletPathRow = (wallet_path, rootView) => {

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
    walletPathText.setText(wallet_path);
    walletPathControlsLayout.addWidget(walletPathText);
    
    const btnSelectWallet = new QPushButton();
    btnSelectWallet.setText("Select Wallet");
    btnSelectWallet.setObjectName(`btnSelectWallet`);

    btnSelectWallet.addEventListener("triggered", () => {
        console.log("Clicked")
    });
    walletPathControlsLayout.addWidget(btnSelectWallet);

    walletFieldsetLayout.addWidget(walletPathControls);    

    rootView.layout.addWidget(walletFieldset);
}

export default openSettingsDialog;