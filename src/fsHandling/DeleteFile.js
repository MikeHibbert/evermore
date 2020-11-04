import {RemoveProposedFile} from '../db/helpers';

const fileDeletedHandler = (file_path) => {
    console.log(`File ${file_path} has been removed`);

    RemoveProposedFile(file_path);
}

export default fileDeletedHandler;