import * as fs from 'fs';

class FileManagerUtil {
    createTextFile(): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile('lsplogs.txt', 'Testing', 'utf8', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    static appendToFile(content: string): Promise<void> {
        if (!fs.existsSync('lsplogs.txt')) {
            fs.writeFile('lsplogs.txt', 'Testing', 'utf8', (err) => {
            });
        }
        return new Promise((resolve, reject) => {
            fs.appendFile('lsplogs.txt', content + '\n', 'utf8', (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
}

export default FileManagerUtil;