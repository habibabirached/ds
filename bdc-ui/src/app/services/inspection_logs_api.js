import { BASE_URL } from './api_config';

export const getInspectionLogs = async () => {
    console.log('getInspectionLogs() called.');
    let data = {};
    try {
        const res = await fetch(`${BASE_URL}/logs`);
        data = await res.json();
        console.log("Read Logs:", data);
    } catch (e) {
        console.log('Error:', e);
    }
    return data;
}


export const createInspectionLogEntry = async (body) => {
    console.log('createInspectionLogEntry() called with: ',body); 
    let data = {};

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }; 
    try {
        let res = await fetch(`${BASE_URL}/logs`,requestOptions);
        data = await res.json();
        console.log('create log entry resp:', data);
    } catch(e) {
        console.log('Error:',e);
    }
    return data;
}


// use this to create a log entry, then modify it with your data
export const getInspectionLogBodyObj = (inspectionId = -1, 
                                       inputPath='', 
                                       message='', 
                                       operation='', 
                                       status='', 
                                       sso='unknown') => {

    return {
        "date": new Date().toISOString(),
        "input_path": inputPath,
        "inspection_id": inspectionId,
        "message": message,
        "operation": operation,
        "sso": sso,
        "status": status
      };
}
