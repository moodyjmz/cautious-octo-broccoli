import { JSDOM } from "jsdom";
import path from "node:path";
import { readFile } from 'node:fs/promises';
import { URLSearchParams } from 'node:url';

const { createHash } = await import('node:crypto');

export class FileTimeStamp {

    timeStampMap = new Map();

    fileHashTimeStampMap = new Map();

    async getNormalisedTimeStampForItem(item) {

        const timeStamp = item.initialTimeStamp;
        // lookup from map
        if (!this.timeStampMap.has(timeStamp)) {
            // we first see if there is an existing file hash - timestamp map
            // load the file and hash it
            const hash = await this.getFileHash(item);
            // lookup the hash - one will be made if it doesn't exist
            const timeStampFromHash = this.getTimeStampFromHash(hash, timeStamp);
            // we now associate the timestamp map with this
            this.timeStampMap.set(timeStamp, timeStampFromHash);
        }
        return this.timeStampMap.get(timeStamp);

    }

    async getFileHash(item) {
        const hash = createHash('sha1');
        // need to load file
        const data = await readFile(path.join(path.resolve(item.parentDir), item.fileName), { encoding: 'utf8' });
        hash.update(data);
        // return sha1
        return hash.digest('hex');
    }

    getTimeStampFromHash(hash, timeStamp) {
        if (!this.fileHashTimeStampMap.has(hash)) {
            this.fileHashTimeStampMap.set(hash, timeStamp);
        }
        return this.fileHashTimeStampMap.get(hash);
    }


}

export class TimeStampNormaliser {

    fileTimeStampMaps = new Map();

    workingDir;

    async getNormalised(htmlString) {
        const dom = this.getHtmlDom(htmlString);
        // get the file time stamp map per file
        await this.normaliseSources(dom);
        console.log(dom.window.document.documentElement.outerHTML);
        return dom.window.document.documentElement.outerHTML;

    }

    async normaliseSources(dom) {
        const sources = await this.getSourcesToNormalise(dom);

        sources.forEach((item) => {
            if(item.newTimeStamp !== item.initialTimeStamp) {
                item.params.set('v', item.newTimeStamp);
                this.assignNewTimeStamp(item);
            }
        });

    }

    assignNewTimeStamp(item) {
        let src = 'href';
        if (item.type === 'script') {
            src = 'src';
        }
        item.element[src] = item.fileName+'?'+item.params.toString();
    }

    getHtmlDom(htmlString) {
        return new JSDOM(htmlString);
    }

    getScriptElements(dom) {
        return [...dom.window.document.scripts];
    }

    getStyleElements(dom) {
        // jsdom appears to process stylesheets differently, hence this
        return [...dom.window.document.querySelectorAll('link[rel=stylesheet]')];
    }

    async createSourceItem(element) {
        let src = 'href';
        let type = 'style';
        let item;
        if (element.src) {
            src = 'src';
            type = 'script';
        }
        const fileName = element[src].split('?');
        const params = new URLSearchParams(fileName[1]);
        const timeStamp = params.get('v');
        const map = this.getFileTimeStampMap(fileName[0]);
        if (timeStamp) {
            item = {
                parentDir: this.workingDir,
                type,
                element,
                params,
                fileName: fileName[0],
                initialTimeStamp: timeStamp,
                map
            };
            item.newTimeStamp = await map.getNormalisedTimeStampForItem(item);
            return item;
        }
        return false;

    }

    async getSourcesToNormalise(dom) {
        // get all script and css
        const allSources = Array.prototype.concat(
            this.getScriptElements(dom),
            this.getStyleElements(dom)
        );
        const sources = [];
        for (const item of allSources) {
            const candidate = await this.createSourceItem(item);
            if (candidate) {
                sources.push(candidate);
            }
        };
        return sources;
    }

    getFileTimeStampMap(item) {
        if (!this.fileTimeStampMaps.has(item.fileName)) {
            this.fileTimeStampMaps.set(item.fileName, new FileTimeStamp());
        }
        return this.fileTimeStampMaps.get(item.fileName);
    }

}
