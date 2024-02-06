import sharp from 'sharp';
// import jsfeat from 'jsfeat';

/**
 * Holds a grayscale image for image processing and provides various means
 * to modify or process it.
 */
class GrayscaleImage {
    buffer: Buffer;
    width: number;
    height: number;
    
    constructor (buffer: Buffer, width: number, height: number) {
        this.buffer = buffer;
        this.width = width;
        this.height = height;
    }

    /**
     * Creates a GrayscaleImage from a Sharp image.
     */
    static async load(img: sharp.Sharp): Promise<GrayscaleImage> {
        try {
            const buffer = await img
                .grayscale()
                .raw()
                .toBuffer({ resolveWithObject: true });
            return new GrayscaleImage(buffer.data, buffer.info.width, buffer.info.height);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * Creates a 1-channel Sharp image from the GrayscaleImage.
     */
    async asSharp(): Promise<sharp.Sharp> {
        const sharpImage = sharp(this.buffer, {
            raw: { 
                width: this.width, 
                height: this.height, 
                channels: 1 
            }})
            .grayscale();
        return sharpImage;
    }

    /**
     * Creates a colored Sharp image from the GrayscaleImage.
     */
    async asColoredSharp(red: number, green: number, blue: number, alpha: number | null=null): Promise<sharp.Sharp> {
        const channels = alpha == null ? 3 : 4;
        const colorBuffer = Buffer.alloc(channels*this.buffer.length);
        for (let k = 0; k < this.buffer.length; k++) {
            colorBuffer[channels*k+0] = red*this.buffer[k]/255;
            colorBuffer[channels*k+1] = green*this.buffer[k]/255;
            colorBuffer[channels*k+2] = blue*this.buffer[k]/255;
            if (!!alpha)
                colorBuffer[channels*k+3] = alpha*this.buffer[k]/255;
        }
        const sharpImage = sharp(colorBuffer, {
            raw: { 
                width: this.width, 
                height: this.height, 
                channels: channels
            }});
        return sharpImage;
    }
    
    /**
     * Resize the image.
     */
    async resize(newWidth: number): Promise<GrayscaleImage> {
        try {
            const aspectRatio = this.width / this.height;
            const newHeight = Math.round(newWidth/aspectRatio);
            console.log(newHeight);
            const resized = await (await this.asSharp())
                .resize({ width: newWidth, height: newHeight })
                .toBuffer();
            return new GrayscaleImage(resized, newWidth, newHeight);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * Returns image as PNG.
     */
    toPNG(): Promise<Buffer> {
        const bufferPNG = sharp(this.buffer, { 
            raw: { 
                width: this.width, 
                height: this.height, 
                channels: 1 
            } 
            }).png().toBuffer();
        return bufferPNG;
    }

    /**
     * Inverts the colors of the image.
     */
    invert() {
        let buffer = Buffer.alloc(this.buffer.length);
        for (let k = 0; k < buffer.length; k++)
            buffer[k] = 255-this.buffer[k];
        return new GrayscaleImage(buffer, this.width, this.height);
    }

    /**
     * Thresholds the image with the resulting image having only two colors, 0 and 255.
     */
    async adaptiveThreshold() {
        const OFFSET = 30;
        const SIGMA = 10;
        const blurredImageSharp = (await this.asSharp()).blur(SIGMA);
        const blurredImage = await GrayscaleImage.load(blurredImageSharp);
        let buffer = Buffer.alloc(this.buffer.length);
        for (let k = 0; k < buffer.length; k++)
            buffer[k] = (this.buffer[k] > blurredImage.buffer[k]-OFFSET) ? 255 : 0;
        return new GrayscaleImage(buffer, this.width, this.height);
    }

    /**
     * Convolves the image with a 3x3 matrix of 1s.
     */
    async dilate() {
        const kernel = Array(9).fill(1);
        const dilatedImageSharp = (await this.asSharp())
            .convolve({
                width: 3,
                height: 3,
                kernel: kernel,
            });
        const dilatedImage = await GrayscaleImage.load(dilatedImageSharp);
        for (let k = 0; k < dilatedImage.buffer.length; k++)
            dilatedImage.buffer[k] = dilatedImage.buffer[k] > 0 ? 255 : 0;
        // let values = new Set();
        // for (let k = 0; k < dilatedImage.buffer.length; k++)
        //     values.add(dilatedImage.buffer[k]);
        // console.log(values);
        return dilatedImage;
    }

    /**
     * Operates Gaussian blur on the image with given radius.
     */
    async blur(radius: number) {
        const sigma = 1 + radius / 2;
        const blurredImageSharp = (await this.asSharp()).blur(sigma);
        const blurredImage = await GrayscaleImage.load(blurredImageSharp);
        return blurredImage;
    }

    /**
     * Counts the number of pixels above a given threshold.
     */
    countAboveThreshold(threshold: number) {
        return this.buffer.reduce((count, pixelValue) => 
            (pixelValue > threshold ? count + 1 : count), 0);
    }

    // toString() {
    //     return `GrayscaleImage(width=${this.width}, height=${this.height})`;
    // }
}

/**
 * Attempts to load the buffer as an image and returns a thumbnail of it if
 * successfull. Otherwise returns null.
 */
async function createThumbnail(buffer: Buffer, thumbnailSize = 200) {
    try {
        // Resize the image to create a thumbnail
        const thumbnailBuffer = await sharp(buffer)
            .resize(thumbnailSize, thumbnailSize)
            .jpeg()
            .toBuffer();
        return thumbnailBuffer;
    } catch (error) {
        console.error('Error creating thumbnail:', error);
        return null;
    }
}

export { GrayscaleImage, createThumbnail };