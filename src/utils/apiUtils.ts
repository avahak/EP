/**
 * Helper function to construct the backend url.
 */
const getApiUrl = () => {
    const port = window.location.hostname === 'localhost' ? ':3001' : '';
    return `${window.location.protocol}//${window.location.hostname}${port}/api`;
};
  
export { getApiUrl };