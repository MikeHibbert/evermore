
import {AddPendingFile} from '../db/helpers';

const fileAddedHandler = (path) => {
    console.log(`File ${path} has been added`)

    AddPendingFile
}

export default fileAddedHandler;