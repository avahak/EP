/**
* Helper function to construct the backend url.
*/
const getApiUrl = () => {
    const port = window.location.hostname === 'localhost' ? ':3001' : '';
    return `${window.location.protocol}//${window.location.hostname}${port}/api`;
};

/**
 * Takes in a name for thumbnail and strips it into the corresponding image name.
 */
function thumbnailToImageName(thumbnailName: string) {
    // Extract the part of the thumbnail name between 'thumbnail_' and the file extension
    const regex = /^thumbnail_(.+)\.[a-zA-Z0-9]+$/;
    const match = thumbnailName.match(regex);
    
    if (match && match[1]) {
        return match[1];
    } else {
        // If the regex doesn't match, return the original name
        return thumbnailName;
    }
}

export { getApiUrl, thumbnailToImageName };