import { BASE_URL } from './api_config';

export const getBladeMonitoring = async () => {
    console.log('getBladeMonitoring() called.');
    let data = {};
    try {
        const res = await fetch(`${BASE_URL}/monitoring/list`);
        data = await res.json();
        console.log("Read Logs:", data);
    } catch (e) {
        console.log('Error:', e);
    }
    return data;
}


