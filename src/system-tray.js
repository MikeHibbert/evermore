import SysTray from 'systray'
import Logo from './logo';

const initSystemTray = () => {
    const systray = new SysTray({
        menu: {
            // you should using .png icon in macOS/Linux, but .ico format in windows
            icon: Logo.toString('base64'),
            title: "Evermore Datastore",
            tooltip: "Evermore Datastore",
            items: [{
                title: "Connect",
                tooltip: "Connect your AR wallet to begin storing data.",
                // checked is implement by plain text in linux
                checked: false,
                enabled: true
            }, {
                title: "Exit",
                tooltip: "Shutdown Evermore Datastore",
                checked: false,
                enabled: true
            }]
        },
        debug: false,
        copyDir: true, // copy go tray binary to outside directory, useful for packing tool like pkg.
    })
    
    systray.onClick(action => {
    if (action.seq_id === 0) {
        systray.sendAction({
            type: 'update-item', 
            item: {
            ...action.item,
            checked: !action.item.checked,
            },
            seq_id: action.seq_id,
        })
    } else if (action.seq_id === 1) {
        // open the url
        console.log('open the url', action)
    } else if (action.seq_id === 2) {
        systray.kill()
    }
    })

    return systray;
}


export default initSystemTray;