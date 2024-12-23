import { BASE_URL } from './api_config';


export const getSideViewImageUrl = (distance=0.0, location, color) => {
   console.log('getSideViewImageUrl() called.');
   let query = '';

   if (distance == null ) distance = 0
   query = query + 'distance='+distance;
   
   if (color != null) {
       query = query + '&color='+color;
   }
   if (location != null) {
       query = query + '&location='+location;
   }
   
   // technique used to create unique urls that force the browser to reload the image each time this method is called
   // query = query + `&ts=${Date.now()}`

   if (query.length > 0) 
       query = '?'+query;

   let url = `${BASE_URL}/blade/side_view_image${query}`.split(' ').join('%20');
   
   //console.log('returning url:',url);
   return url;
}

export const getCrossSectionImageUrl = (distance=0.0, location='te', color='black') => {
    console.log('getCrossSectionImageUrl() called.');
    let query = '';
    
    if (distance == null ) distance = 0
    query = query + 'distance='+distance;
    
    if (color != null) {
        query = query + '&color='+color;
    }
    if (location != null ) {
        query = query + '&location='+location;
    }
    
    // technique used to create unique urls that force the browser to reload the image each time this method is called
    // query = query + `&ts=${Date.now()}`

    if (query.length > 0) 
        query = '?'+query;

    let url = `${BASE_URL}/blade/cross_section_image${query}`.split(' ').join('%20');

    //console.log('returning url:',url);
    return url;
}