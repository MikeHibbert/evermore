import React, {Component} from 'react';
import FileTableRow from '../../components/Files/FileTableRow';


class RecentActivity extends Component {
	getRecentFiles(folders, recent_files) {
		for(let i in folders.children) {
			
			const path = folders.children[i];
			if(path.type == "folder") {
				this.getRecentFiles(path, recent_files);
			} else {
			recent_files.push(path);
			}
		}

		
	}

    render() {

		const recent_files = [];

		if(this.props.files != null) {
			this.getRecentFiles(this.props.files[""], recent_files);
		}
		
		for(let i in recent_files) {
			const file_info = recent_files[i];

			if(!file_info.hasOwnProperty('version')) {
				file_info['version'] = 1;
			}

			const matched_files = recent_files.filter(fo => fo.path == file_info.path);

			for(let j in matched_files) {
				const mf = matched_files[j];
				
				if(mf.modified > file_info.modified) {
					mf['version'] = file_info.version + 1;
				} 
			}
		}

		const filtered_files = [];
		recent_files.forEach(function(item){
			var i = filtered_files.findIndex(x => (x.path == item.path) && (x.modified == item.modified));
			if(i <= -1){
				filtered_files.push({...item});
			}
		  });
		  
        const file_rows = filtered_files.map(file => {
            return <FileTableRow file_info={file} key={file.id} />;
        }) 
        return (
            <div className="row gutters-sm">

						<div className="col-12 mb-3">


							<div className="portlet">

								<div className="portlet-header border-bottom">
									<span>Recent Activity</span>
								</div>

								<div className="portlet-body">
									<div className="container py-6">

											<div className="table-responsive">
												<table className="table table-framed">
													<thead>
														<tr>
															<th className="text-gray-500 font-weight-normal fs--14 min-w-300">FILE NAME</th>
															<th className="text-gray-500 font-weight-normal fs--14 w--100 text-center">LAST MODIFIED</th>
                                                            <th className="text-gray-500 font-weight-normal fs--14 w--60 text-align-end">&nbsp;</th>
														</tr>
													</thead>

													<tbody id="item_list">
														{file_rows}
													</tbody>

													<tfoot>
														<tr>
                                                            <th className="text-gray-500 font-weight-normal fs--14 min-w-300">FILE NAME</th>
															<th className="text-gray-500 font-weight-normal fs--14 w--100 text-center">LAST MODIFIED</th>
                                                            <th className="text-gray-500 font-weight-normal fs--14 w--60 text-align-end">&nbsp;</th>
														</tr>   
													</tfoot>

												</table>
											</div>

                                            

									</div>
								</div>

							</div>

						</div>

					</div>
        )
    }
}

export default RecentActivity;