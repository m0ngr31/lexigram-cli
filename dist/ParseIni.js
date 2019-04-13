export default class ParseIni {
    constructor() {
        this.ini = '';
    }
    cleanComments(line) {
        let cleanLine = line;
        if (cleanLine.indexOf('#') > -1)
            cleanLine = cleanLine.substring(0, cleanLine.indexOf('#'));
        if (cleanLine.indexOf(';') > -1)
            cleanLine = cleanLine.substring(0, cleanLine.lastIndexOf(';'));
        cleanLine = cleanLine.trim();
        return cleanLine;
    }
    headerCheck(line) {
        return line[0] === '[' && line.substring(line.length - 1) === ']';
    }
    destructureValue(line) {
        let cleanLine = line;
        let response = '';
        if (cleanLine.indexOf('=') > -1) {
            response = cleanLine.substring(cleanLine.indexOf('=') + 1);
            cleanLine = cleanLine.substring(0, cleanLine.indexOf('='));
            cleanLine = cleanLine.trim();
            response = response.trim();
        }
        return [cleanLine, response];
    }
    setOjb(obj) {
        if (!this.ini && !(this.ini.length === 0))
            return;
        const objCheck = Object.assign({}, obj);
        const lines = this.ini.split(/\n/i);
        let lastHeader = 'unset';
        let foundHeader = -1;
        let foundMatch = false;
        for (let a = 0; a < lines.length; a++) {
            let cleanLine = this.cleanComments(lines[a]);
            if (cleanLine.length > 0) {
                if (this.headerCheck(cleanLine)) {
                    if (lastHeader !== 'unset') {
                        delete objCheck[lastHeader];
                    }
                    lastHeader = cleanLine.replace(/(\[|\])/g, '');
                    if (!obj[lastHeader])
                        continue;
                }
                else {
                    let response;
                    [cleanLine, response] = this.destructureValue(cleanLine);
                    if (!obj[lastHeader] || (obj[lastHeader] && !obj[lastHeader][cleanLine]))
                        continue;
                    if (obj[lastHeader][cleanLine]) {
                        lines[a] = `${cleanLine}=${obj[lastHeader][cleanLine]}`;
                    }
                }
            }
        }
        for (let key in objCheck) {
            if (objCheck.hasOwnProperty(key)) {
                lines.push(`\n[${key}]`);
                for (let subkey in objCheck[key]) {
                    if (objCheck[key].hasOwnProperty(subkey)) {
                        lines.push(`${subkey}=${objCheck[key][subkey]}`);
                    }
                }
            }
        }
        const newLines = lines.join('\n');
        this.parse(newLines);
    }
    set(header, field, value) {
        if (!this.ini)
            return;
        const lines = this.ini.split(/\n/i);
        let lastHeader = 'unset';
        let foundHeader = -1;
        let foundMatch = false;
        for (let a = 0; a < lines.length; a++) {
            let cleanLine = this.cleanComments(lines[a]);
            if (cleanLine.length > 0) {
                if (this.headerCheck(cleanLine)) {
                    lastHeader = cleanLine.replace(/(\[|\])/g, '');
                    if (lastHeader === header)
                        foundHeader = a;
                }
                else {
                    let response;
                    [cleanLine, response] = this.destructureValue(cleanLine);
                    if (lastHeader === header && field === cleanLine) {
                        lines[a] = `${field}=${value}`;
                        foundMatch = true;
                        break;
                    }
                }
            }
        }
        if (!foundMatch && foundHeader > -1)
            lines.splice(foundHeader + 1, 0, `${field}=${value}`);
        const newLines = lines.join('\n');
        this.parse(newLines);
    }
    verifyData() {
        try {
            if (this.schema && (this.schema['default'] || this.schema['DEFAULT'])) {
                let data;
                if (this.schema['default']) {
                    data = this.schema['default'];
                }
                else {
                    data = this.schema['DEFAULT'];
                }
                if (!data.scheme || (data.scheme && !data.scheme.length)) {
                    return false;
                }
                if (!data.address || (data.address && !data.address.length)) {
                    return false;
                }
                if (!data.port || (data.port && !data.port.length)) {
                    return false;
                }
                if (!data.username || (data.username && !data.username.length)) {
                    return false;
                }
                if (!data.password || (data.password && !data.password.length)) {
                    return false;
                }
                return true;
            }
            return false;
        }
        catch (e) {
            return false;
        }
    }
    parse(ini) {
        const lines = ini.split(/\n/i);
        let schema = {};
        let lastHeader = 'unset';
        lines.forEach(line => {
            let cleanLine = this.cleanComments(line);
            if (cleanLine.length > 0) {
                if (this.headerCheck(cleanLine))
                    lastHeader = cleanLine.replace(/(\[|\])/g, '');
                else {
                    let response;
                    [cleanLine, response] = this.destructureValue(cleanLine);
                    if (!schema[lastHeader])
                        schema[lastHeader] = {};
                    schema[lastHeader][cleanLine] = response;
                }
            }
        });
        this.schema = schema;
        this.ini = ini;
    }
}
