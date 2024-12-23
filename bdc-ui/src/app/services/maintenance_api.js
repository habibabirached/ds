import { BASE_URL } from './api_config';

export const getListOfImagesWithMissingFiles = async (inspectionId) => {
    console.log('getListOfImagesWithMissingFiles() called with inspectionId: ', inspectionId );
    
    let url = `${BASE_URL}/maintenance/inspection/${inspectionId}/image_list/missing_image_files`;

    let data = []
    try {
        let res = await fetch(url);
        data = await res.json();
        console.log('List of images with missing files:', data);
    } catch (e) {
        console.log('Error:', e);
    }

    return data;
};