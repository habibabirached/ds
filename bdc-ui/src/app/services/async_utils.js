// ----------------------------- Utility functions --------------------------------
export const delay = (ms) => {
    console.log('waiting for: ',ms,'ms')
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const waitForResponse = async (taskId) => {
    let status = null;
    while (status !== 'COMPLETE') {
        const taskStatusUrl = `/api/task/${taskId}/status`;
        let taskStatusResp = await fetch(taskStatusUrl);
        let statusData = await taskStatusResp.json();
        console.log('current status: ',statusData);
        status = statusData.status;
        await delay(3000);
    }
    console.log(`DONE waiting for ${taskId}. status: ${status}`);
};

export const deleteTask = async (taskId) => {
    console.log('deleteTask() for id:',taskId);
    const taskStatusUrl = `/api/task/${taskId}/file`;
    let taskDeleteResp = await fetch(taskStatusUrl,{method:'DELETE'});
    let deleteData = await taskDeleteResp.json();
    console.log('delete resp:',deleteData);
};

export const fetchAndDeleteFile = (taskId, filename) => {
    // once the file processing is ready, we can download it

    let url = `/api/task/${taskId}/file`;
    fetch(url, {
        method:'GET' // can also be POST
    }).then((transfer) => {
        return transfer.blob();                
    }).then((bytes) => {
        let elm = document.createElement('a');  
        elm.href = URL.createObjectURL(bytes);  
        elm.setAttribute('download', filename); 
        elm.click();
        deleteTask(taskId); // delete it at the end
    }).catch((error) => {
        console.log(error);                     
    })
};

export const getTextFileContent = async (taskId) => {
    // once the file processing is ready, we can download it

    try {
        let url = `/api/task/${taskId}/file`;
        let res = await fetch(url, {
            method:'GET', // can also be POST
            headers: {
                'content-type': 'text/csv;charset=UTF-8',
            }
        });
        if (res.status === 200) {
            const data = await res.text();
            return data;
        } else {
            console.log(`Error code ${res.status}`);
            return null;
        }
    } catch(err) {
        console.log('Error reading text file content:', err);
    }

};