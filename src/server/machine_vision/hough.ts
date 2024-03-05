import sharp from 'sharp';       // https://sharp.pixelplumbing.com/
import { GrayscaleImage } from "../imageTools.js";

/**
 * Luokka Hough-muunnoksien laskemisksi annetusta mustavalkoisesta kuvasta.
 * Hough-muunnos löytää viivat kuvasta.
 * Hough-muunnos Wikipediassa: https://en.wikipedia.org/wiki/Hough_transform
 */
class HoughTransform {

    public votes: Int32Array;       // indexing: buffer[r*sizeAngle+theta]
    public source: GrayscaleImage;
    public sizeAngle: number;       // kulma dimensio suuruus houghMap:ssa
    public sizeRadius: number;      // radius dimension suuruus houghMap:ssa
    public deltaRadius: number;     // etäisyys kahden peräkkäisen radius välillä

    private constructor(source: GrayscaleImage) {
        this.source = source;
        this.sizeAngle = 400;
        this.deltaRadius = 2;
        this.sizeRadius = Math.round(Math.sqrt(source.width**2 + source.height**2) / this.deltaRadius);
        this.votes = new Int32Array((2*this.sizeAngle+1)*this.sizeRadius);
    }

    /**
     * Kirjaa kaikki annetut äänet (votes).
     */
    private countVotes() {
        for (let k = 0; k < this.votes.length; k++)
            this.votes[k] = 0;
        for (let ky = 0; ky < this.source.height; ky++) {
            for (let kx = 0; kx < this.source.width; kx++) {
                if (this.source.buffer[ky*this.source.width+kx] < 128)
                    continue;
                // Tässä tulisi käyttää optimointia, missä ainoastaan
                // sellaiset pixelit voivat äänestää, joiden lokaali gradientti on
                // lähellä kulmaa angle.
                for (let angle = 0; angle < this.sizeAngle; angle++) {
                    // Hesse normaalimuoto: r = x*cos(theta) + y*sin(theta)
                    const theta = Math.PI*angle/this.sizeAngle;
                    const r = kx*Math.cos(theta) + ky*Math.sin(theta);
                    this.votes[(this.sizeRadius+Math.round(r/this.deltaRadius))*this.sizeAngle+angle] += 1;
                }
            }
        }
    }

    /**
     * Sumentaa äänitaulukkoa tuloksen parantamiseksi. 
     */
    private smoothen() {
        // const kernel = [1];
        const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
        // const kernel = [1, 4, 6, 4, 1, 4, 16, 24, 16, 4, 6, 24, 36, 24, 6, 4, 16, 24, 16, 4, 1, 4, 6, 4, 1];
        // const kernel = new Array(9).fill(1);
        const kernelSize = Math.round(Math.sqrt(kernel.length));
        const kernelSum = kernel.reduce((acc, value) => acc + value, 0);
        const kernelOffset = Math.floor(kernelSize/2);
        const ITER_NUM = 1;
        for (let iter = 0; iter < ITER_NUM; iter++) {
            const smoothVotes = new Int32Array(this.votes.length);
            for (let kernelX = 0; kernelX < kernelSize; kernelX++) {
                for (let kernelY = 0; kernelY < kernelSize; kernelY++) {
                    const kernelValue = kernel[kernelY*kernelSize+kernelX];
                    for (let angle = 0; angle < this.sizeAngle; angle++) {
                        for (let r = 0; r < 2*this.sizeRadius+1; r++) {
                            const r2 = r + kernelX - kernelOffset;
                            const angle2 = angle + kernelY - kernelOffset;
                            if (r2 < 0 || r2 >= 2*this.sizeRadius+1 || angle2 < 0 || angle2 >= this.sizeAngle)
                                continue;
                            smoothVotes[r*this.sizeAngle+angle] += kernelValue*this.votes[r2*this.sizeAngle+angle2];
                        }
                    }
                }
            }
            for (let k = 0; k < smoothVotes.length; k++)
                smoothVotes[k] = Math.round(smoothVotes[k] / kernelSum);
            this.votes = smoothVotes;
        }
    }

    /**
     * Löytää piikit votes taulukosta käyttäen "non-maximal suppression" menetelmää.
     * Idea: 
     * 1) etsi kaikki äänet, jotka ovat tietyn rajan yläpuolella ja ovat lokaalisti maksimaalisia
     * 2) järjestä äänet niiden lukumäärän perusteella
     * 3) valitse suurimman äänimäärän elementti
     * 4) poista äänet kohdassa 3) valitun elementin ympärillä
     * 5) toista kohtia 3) ja 4) kunnes piikkejä ei enää löydy.
     */
    private findPeaks() {
        const threshold = 100;
        const overlapRadius = 20;
        const candidatePeaks: any[] = [];   // elementit: [r, angle, numberOfVotes]

        // täytä candidatePeaks:
        for (let angle = 0; angle < this.sizeAngle; angle++) {
            for (let r = 0; r < 2*this.sizeRadius+1; r++) {
                const value = this.votes[r*this.sizeAngle+angle];
                if (value < threshold)
                    continue;
                let isLocalMaximum = true;
                for (let da = -2; da <= 2; da++) {
                    for (let dr = -2; dr <= 2; dr++) {
                        let r2 = r + dr;
                        let angle2 = angle + dr;
                        if (r2 < 0 || angle2 < 0 || r2 >= 2*this.sizeRadius+1 || angle2 >= this.sizeAngle)
                            continue;
                        const value2 = this.votes[r2*this.sizeAngle+angle2];
                        if (value2 > value)
                            isLocalMaximum = false;
                    }
                }
                if (isLocalMaximum)
                    candidatePeaks.push([r, angle, value]);
            }
        }

        // Järjestä candidatePeaks kolmannen kohdan (value) perusteella vähenevään järjestykseen
        candidatePeaks.sort((a, b) => b[2] - a[2]);

        // valitse peaks candidatePeaks joukosta, jotka eivät ole lähellä jo valittuja piikkejä
        const peaks: any[] = [];
        for (let k = 0; k < candidatePeaks.length; k++) {
            let isOverlapping = false;
            for (let j = 0; j < peaks.length; j++) {
                const dr = peaks[j][0] - candidatePeaks[k][0];
                let da = peaks[j][1] - candidatePeaks[k][1];
                if (da > this.sizeAngle/2)
                    da -= this.sizeAngle;
                if (da < -this.sizeAngle/2)
                    da += this.sizeAngle;
                const dist = Math.sqrt(dr*dr + da*da);
                if (dist < overlapRadius) {
                    isOverlapping = true;
                    break;
                }
            }
            if (!isOverlapping)
                peaks.push(candidatePeaks[k]);
        }
        return peaks;
    }

    /**
     * Visualisoi algoritmin lopputuloksen.
     */
    public async visualize(peaks: any[], maxNum=16) {
        const buffer = Buffer.alloc(this.source.buffer.length);

        for (let k = 0; k < Math.min(maxNum, peaks.length); k++) {
            // We use Hesse normal form: r = x*cos(theta) + y*sin(theta)
            const r = (peaks[k][0]-this.sizeRadius)*this.deltaRadius;
            const angle = peaks[k][1];
            const theta = Math.PI*angle/this.sizeAngle;
            if (Math.abs(Math.cos(theta)) > Math.abs(Math.sin(theta))) {
                // line is vertically dominant
                for (let ky = 0; ky < this.source.height; ky++) {
                    const kx = (r - ky*Math.sin(theta)) / Math.cos(theta);
                    if (kx >= 0 && kx < this.source.width)
                        buffer[ky*this.source.width+Math.round(kx)] = 255;
                }
            } else {
                // line is horizontally dominant
                for (let kx = 0; kx < this.source.width; kx++) {
                    const ky = (r - kx*Math.cos(theta)) / Math.sin(theta);
                    if (ky >= 0 && ky < this.source.height)
                        buffer[Math.round(ky)*this.source.width+kx] = 255;
                }
            }
        }
        const lines = new GrayscaleImage(buffer, this.source.width, this.source.height);
        const img1 = await (await lines.asColoredSharp(255, 64, 64, 255)).png().toBuffer();
        const img2 = await (await this.source.asColoredSharp(255, 255, 255));
        const comp = img2.composite([
            { input: img1 },
        ]);
        return comp;
    }

    /**
     * Käy läpi kaikki askeleet Hough-muunnoksessa.
     */
    static async hough(imgPath: string) {
        // operaatiot: grayscale, gaussian blur, threshold, invert, dilate
        const image = sharp(imgPath);

        let gsi = await (await GrayscaleImage.load(image)).resize(800);
        let gsi2 = await ((await gsi.adaptiveThreshold()).invert());//.dilate();

        const map = new HoughTransform(gsi2);
        map.countVotes();
        map.smoothen();
        const peaks = map.findPeaks();
        console.log("peaks", peaks);
        return [await (await gsi2.asSharp()).png().toBuffer(), await (await map.visualize(peaks)).png().toBuffer()];

        // let count = gsi2.countAboveThreshold(128);
        // console.log(`white pixels: ${count}, ${100*count/(gsi2.width*gsi2.height)}%`);

        // console.log(gsi2);

        // return gsi2;
    }

}

export { HoughTransform };