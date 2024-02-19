import jsfeat from 'jsfeat';
import sharp from 'sharp';

/**
 * Homography löytää homografian kahden kuvan välillä niiden piirteiden perusteella.
 * Ensin kummastakin kuvasta löydetään niiden tärkeimmät piirteet 
 * (findKeypoints, findDescriptors), sitten parhaiten toisiansa vastaavat piirteet 
 * yhdistetään (match, resiprocalMatch) ja lopuksi löydetään homografia, joka
 * parhaiten yhdistää vastaavat piirteet toisiinsa (homography).
 * Homografia Wikipediassa: https://en.wikipedia.org/wiki/Homography_(computer_vision)
 */
class Homography {

    // Kuvan esikäsittelyssä sumennetaan kuva tällä sigma-arvolla:
    static BLUR_SIZE = 5;

    static hammingWeight: Uint8Array | null = null;
    imagePath1: string;
    imagePath2: string;
    data: any;

    constructor(imagePath1: string, imagePath2: string) {
        if (!Homography.hammingWeight)
            Homography.computeHammingWeights();
        this.imagePath1 = imagePath1;
        this.imagePath2 = imagePath2;
    }

    /**
     * Hamming etäisyyksien (eroavien bittien lukumäärä) esilaskentaa.
     */
    static computeHammingWeights() {
        Homography.hammingWeight = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            Homography.hammingWeight[i] = (i & 1) + ((i >> 1) & 1) + ((i >> 2) & 1) + ((i >> 3) & 1) +
                    ((i >> 4) & 1) + ((i >> 5) & 1) + ((i >> 6) & 1) + ((i >> 7) & 1);
        }
    }

    /**
     * Palauttaa Hamming-etäisyyden kahden piirteen välillä.
     */
    // @ts-ignore
    static hammingDistance(descriptor1: Uint8Array, descriptor2: Uint8Array) {
        if (descriptor1.length !== descriptor2.length) {
            throw new Error('Descriptor lengths do not match');
        }
        
        let distance = 0;
        for (let i = 0; i < descriptor1.length; i++) {
            let xorResult = descriptor1[i] ^ descriptor2[i];
            distance += Homography.hammingWeight![xorResult];
        }
        return distance;
    }

    /**
     * Palauttaa mustavalkoisen ja gaussisesti sumennetun kuvan.
     */
    async grayscaleImage(imageUrl: string) {
        const imageRgb = await sharp(imageUrl).raw().toBuffer();
        const { width, height } = await sharp(imageUrl).metadata();
        
        // Muuttaa kuvat mustavalkoisiksi
        let imageRaw = new jsfeat.matrix_t(width, height, jsfeat.U8_t | jsfeat.C1_t);
        let image = new jsfeat.matrix_t(width, height, jsfeat.U8_t | jsfeat.C1_t);
        jsfeat.imgproc.grayscale(imageRgb, width, height, imageRaw, jsfeat.COLOR_RGB2GRAY);
        jsfeat.imgproc.gaussian_blur(imageRaw, image, Homography.BLUR_SIZE);

        return image;
    }


    /**
     * Etsii FAST-piirteitä kuvasta käyttäen jsfeat kirjastoa.
     */
    findKeypoints(image: any) {
        let corners: any[] = [];
        
        for(let i = 0; i < image.cols*image.rows; i++)
            corners[i] = new jsfeat.keypoint_t(0,0,0,0,-1);
        
        jsfeat.fast_corners.set_threshold(20);
        let count = jsfeat.fast_corners.detect(image, corners, 3);

        // jsfeat.yape06.laplacian_threshold = 30;
        // jsfeat.yape06.min_eigen_value_threshold = 25;
        // let count = jsfeat.yape06.detect(image, corners, 17);
        
        console.log("corners count:", count);
        console.log("corners", corners);
        
        const returns: any[] = [];
        for (let k = 0; k < count; k++)
            returns.push(corners[k]);
        return returns;
    }

    /**
     * Palauttaa piirteiden ORB-kuvaukset käyttäen jsfeat kirjastoa.
     */
    findDescriptors(image: any, corners: any[]) {
        let cols = 32; // 32 tavua = 256 bittiä / descriptor
        let rows = corners.length;
        let descriptors = new jsfeat.matrix_t(cols, rows, jsfeat.U8_t | jsfeat.C1_t);
        
        jsfeat.orb.describe(image, corners, rows, descriptors);

        return descriptors;
    }

    /**
     * Palauttaa listan toisansa vastaavista piirteistä.
     */
    match(descriptors1: any, descriptors2: any) {
        let matches: any[] = [];
        for (let k1 = 0; k1 < descriptors1.rows; k1++) {
            const row1 = descriptors1.data.subarray(k1*descriptors1.cols, (k1+1)*descriptors1.cols);

            let bestIndex = -1;
            let bestScore = Number.MAX_SAFE_INTEGER;

            for (let k2 = 0; k2 < descriptors2.rows; k2++) {
                const row2 = descriptors2.data.subarray(k2*descriptors2.cols, (k2+1)*descriptors2.cols);

                const score = Homography.hammingDistance(row1, row2);
                if (score < bestScore) {
                    bestIndex = k2;
                    bestScore = score;
                }
            }
            matches.push({index: k1, matchIndex: bestIndex, score: bestScore});
        }
        return matches;
    }

    /**
     * Palauttaa ainoastaan sellaiset piirteiden vastaavuudet, 
     * missä kuvan 1 piirre A vastaa parhaiten kuvan 2 piirrettä B ja piirre B
     * vastaa parhaiten piirrettä A. Piirteet muodostavat näin parin.
     */
    resiprocalMatches(matches12: any[], matches21: any[]) {
        return matches12
            // .filter(match12 => match12.score < 100)
            .filter(match12 => matches21[match12.matchIndex].matchIndex === match12.index);
    }

    /**
     * Löytää homografian vastaavien piirteiden välille. Tässä
     * käytetään jsfeat kirjaston ransac-funktiota.
     */
    homography(corners1: any[], corners2: any[], matches: any[]) {
        let ransac = jsfeat.motion_estimator.ransac;
        
        // luodaan homografia kerneli:
        let homo_kernel = new jsfeat.motion_model.homography2d();
        let transform = new jsfeat.matrix_t(3, 3, jsfeat.F32_t | jsfeat.C1_t);
        let count = matches.length;

        let from = matches.map(match => corners1[match.index]);
        let to = matches.map(match => corners2[match.matchIndex]);
        
        // maski ransac funktiolle, 1=hyvä, 0=huono
        let mask = new jsfeat.matrix_t(count, 1, jsfeat.U8C1_t);
        
        let model_size = 4;
        let thresh = 3;
        let eps = 0.5; // max outliers ratio
        let prob = 0.99; // onnistumisen todennäköisyys
        let params = new jsfeat.ransac_params_t(model_size, thresh, eps, prob);
        
        let max_iters = 1000;
        
        let hg = ransac(params, homo_kernel, from, to, count, transform, mask, max_iters);
        return hg ? transform : null;
    }

    /**
     * Suorittaa kaikki askeleet homografian löytämiseksi.
     */
    async execute() {
        let image1 = await this.grayscaleImage(this.imagePath1);
        let corners1 = this.findKeypoints(image1);
        let descriptors1 = this.findDescriptors(image1, corners1);

        let image2 = await this.grayscaleImage(this.imagePath2);
        let corners2 = this.findKeypoints(image2);
        let descriptors2 = this.findDescriptors(image2, corners2);

        let matches12 = this.match(descriptors1, descriptors2);
        let matches21 = this.match(descriptors2, descriptors1);
        let matches = this.resiprocalMatches(matches12, matches21);
        // let matches = matches12;

        // Järjestetään matches:
        // matches.sort((a, b) => a.score - b.score);
        matches.sort((a, b) => -(corners1[a.index].score - corners1[b.index].score));

        // console.log("matches12", matches12);
        // console.log("matches21", matches21);
        // console.log("matches", matches);
        console.log("matches.length", matches.length);

        let hg = this.homography(corners1, corners2, matches);
        // console.log("hg", hg);

        const warpedImage = new jsfeat.matrix_t(image1.cols, image1.rows, jsfeat.U8_t | jsfeat.C1_t);
        if (!!hg)
            jsfeat.imgproc.warp_perspective(image2, warpedImage, hg);

        this.data = { image1, image2, warpedImage, corners1, corners2, descriptors1, descriptors2, matches, hg };
    }

}

export { Homography };