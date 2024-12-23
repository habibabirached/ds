import { BASE_URL } from './api_config';

export const getCertificateById = async (id) => {
    console.log('getCertificateById() called with id:', id);
    let data = {};
    try {
        const res = await fetch(`${BASE_URL}/certificate/${id}`);
        data = await res.json();
        console.log("Read Certificate:", data);
    } catch (e) {
        console.log('Error:', e);
    }
    return data;
}

export const getCertificateList = async (esn=null) => {
    console.log('getCertificateList() called');
    let data = [];
    let query = ''
    if (esn != null) {
        query = `?esn=${esn}`
    }
    try {
        const res = await fetch(`${BASE_URL}/certificate/list${query}`);
        data = await res.json();
        console.log("Read Certificate list:", data);
        if (! Array.isArray(data)) {
            data = [];
        }
    } catch (e) {
        console.log('Error:', e);
    }
    return data;
}

export const findInspectionImage = async (inspectionId, distance) => {
    console.log('findInspectionImage() called');
    let data = [];
    let query = ''
    if (distance != null) {
        query = `?distance=${distance}`
    }
    try {
        const res = await fetch(`${BASE_URL}/inspection/${inspectionId}/image/find${query}`);
        data = await res.json();
        console.log("Read Inspection list:", data);
        if (! Array.isArray(data)) {
            data = [];
        }
    } catch (e) {
        console.log('Error:', e);
    }
    return data;
}


export const createCertificate = async (body) => {
    console.log('createCertificate() called with: ',body);
    
    let data = {};
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
                    'accept': 'application/json' },
        body: JSON.stringify(body)
    }; 

    try {
        let res = await fetch(`${BASE_URL}/certificate`, requestOptions);
        data = await res.json();
        console.log('Certificate created:', data);
    } catch(e) {
        console.log('Error:',e);
    }

    return data;
}

export const deleteCertificate = async (id) => {
    console.log('deleteCertificate() called with id:',id);
    
    let data = {};
    const requestOptions = {
        method: 'DELETE',
    }; 

    try {
        let res = await fetch(`${BASE_URL}/certificate/${id}`, requestOptions);
        data = await res.json();
        console.log('delete response:', data);
    } catch(e) {
        console.log('Error:',e);
    }
    return data;
}


export const updateCertificate = async (id, body) => {
    console.log('updateCertificate() called with: ',id, body); 
    let data = {};

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }; 
    try {
        let res = await fetch(`${BASE_URL}/certificate/${id}/update`,requestOptions);
        data = await res.json();
        console.log('Certificate update resp:', data);
    } catch(e) {
        console.log('Error:',e);
    }
    return data;
}
