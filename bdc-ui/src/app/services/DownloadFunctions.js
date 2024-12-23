export const downloadJsonAsFile =  (exportObj, exportName) => {
    let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    
    let downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName );
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};


export const downloadJsonAsCSVFile = (jsonData, exportName) => {
    console.log('downloadJsonAsCSVFile() called');
    // Convert JSON data to CSV
    let csvData = jsonToCsv(jsonData);
    // Create a CSV file and allow the user to download it
    let blob = new Blob([csvData], { type: 'text/csv' });
    let url = window.URL.createObjectURL(blob);

    let downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", url);
    downloadAnchorNode.setAttribute("download", exportName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};


export const jsonToCsv = (jsonDataList) => {
    console.log('jsonToCsv() called');
    let csv = '';

    // Get the headers
    let headers = Object.keys(jsonDataList[0]);
    csv += headers.join(',') + '\n';
    
    // Add the data
    jsonDataList.forEach( (row) => {
        let dataLine = headers.map(header => JSON.stringify(row[header])).join(','); // Add JSON.stringify statement
        //dataLine = dataLine.replace('\\r','');
        console.log('dataLine:',dataLine);
        csv += dataLine + '\n';

    });

    return csv;
}


export const downloadFileUrl = (url, filename) => {
    // once the file processing is ready, we can download it

    fetch(url, {
        method:'GET' // can also be POST
    }).then((transfer) => {
        return transfer.blob();                
    }).then((bytes) => {
        let elm = document.createElement('a');  
        elm.href = URL.createObjectURL(bytes);  
        elm.setAttribute('download', filename); 
        elm.click();
    }).catch((error) => {
        console.log(error);                     
    })
};
