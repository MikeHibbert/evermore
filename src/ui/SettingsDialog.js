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

  import {walletFileSet, setWalletFilePath} from '../db/helpers';
  import openConnectDialog from './ConnectDialog';

  const rootStyleSheet = `
  #rootView {
    margin: 10px;
  }

  #walletPathControls {
    flex-direction: row;
    
  }

  #actions {
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
       
        createActionsRow(editable_settings, rootView, win);

        rootView.setStyleSheet(rootStyleSheet);

        win.setCentralWidget(rootView);
        win.setWindowTitle("Evermore Settings");
        // win.resize(800, 640);
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

const createActionsRow = (editable_settings, rootView, win) => {
  const actions = new QWidget();
  const actionsLayout = new FlexLayout();
  actions.setObjectName('actions');
  actions.setLayout(actionsLayout);

  const btnSave = new QPushButton();
  btnSave.setText("Save");
  btnSave.setObjectName(`btnSave`);

  btnSave.addEventListener("clicked", () => {
      if(editable_settings.changed) {
        setWalletFilePath(editable_settings.wallet_file);
      }  

      win.hide();  
  });

  actionsLayout.addWidget(btnSave);

  const btnCancel = new QPushButton();
  btnCancel.setText("Cancel");
  btnCancel.setObjectName(`btnCancel`);

  btnCancel.addEventListener("clicked", () => {
      win.hide();      
  });

  actionsLayout.addWidget(btnCancel);

  rootView.layout.addWidget(actions);
}

export default openSettingsDialog;