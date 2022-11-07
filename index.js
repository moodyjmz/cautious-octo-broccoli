import { TimeStampNormaliser } from './src/timestamp.js';
import { readdir, stat, readFile } from 'node:fs/promises';
import path from 'path';

const SERVER_DIR = './servers';

const TimeStampNormaliserInstance = new TimeStampNormaliser();
let workingDir;
function preprocessHTML(htmlAsString) {
    TimeStampNormaliserInstance.workingDir = workingDir;
    TimeStampNormaliserInstance.getNormalised(htmlAsString);
}

try {
    const files = await readdir(SERVER_DIR);
    for (const file of files) {
        workingDir = path.join(SERVER_DIR, file);
        const stats = await stat(workingDir);
        if (stats.isDirectory()) {
            // we have a pretend server, get the index file
            TimeStampNormaliserInstance.workingDir = path.resolve(workingDir);
            const data = await readFile(path.join(workingDir, 'index.html'), { encoding: 'utf8' });
            preprocessHTML(data);
        }
    }
} catch (err) {
    console.error(err);
}
