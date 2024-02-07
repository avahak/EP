// OpenCV testing, NOT USED

// import sharp from 'sharp';
// import * as cv from 'opencv.js';
// declare const cv: any;

// async function readImage(imageUrl: string) {
//     try {
//         const im = await sharp(imageUrl).raw().toBuffer({ resolveWithObject: true });
//         const rawIm = {
//             width: im.info.width,
//             height: im.info.height,
//             data: im.data,
//         };
//         return rawIm;
//     } catch(err) {
//         console.log('Error reading image:', err);
//         throw err;
//     }
// }

function test() {
    // Load an image
    // var raw_data = readImage("./box.png");

    // Create a matrix from image. input image expected to be in RGBA format
    // var src = cv.matFromImageData(raw_data);
    // let x = cv.Mat();

    // console.log("x", x);
    // cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY); // Convert to grayscale

    // const detector = new cv.ORB();
    // const keypoints = detector.detect(grayImg);
    // console.log(keypoints);
    // cv.drawKeypoints(img, keypoints, img);

    // cv.imshow('Image with keypoints', img);
    // cv.waitKey(0);
    // cv.destroyAllWindows();
}

export { test };