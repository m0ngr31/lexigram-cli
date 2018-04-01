export default class ParseIni {
  public schema: any;
  public ini: string = '';

  constructor() {}

  private cleanComments(line: string): string {
    let cleanLine = line;

    // Skip comments
    if (cleanLine.indexOf('#') > -1)
      cleanLine = cleanLine.substring(0, cleanLine.indexOf('#'));
    if (cleanLine.indexOf(';') > -1)
      cleanLine = cleanLine.substring(0, cleanLine.lastIndexOf(';'));

    cleanLine = cleanLine.trim();

    return cleanLine;
  }

  private headerCheck(line: string): boolean {
    return line[0] === '[' && line.substring(line.length - 1) === ']';
  }

  private destructureValue(line: string): Array<string> {
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

  public setOjb(obj: any) {
    if (!this.ini && !(this.ini.length === 0))
      return;

    const objCheck = {...obj};

    const lines: Array<string> = this.ini.split(/\n/i);
    let lastHeader: string = 'unset';
    let foundHeader: number = -1;
    let foundMatch: boolean = false;

    // Adding obj data to existing ini sheet
    for (let a: number = 0; a < lines.length; a++) {
      let cleanLine = this.cleanComments(lines[a]);

      if (cleanLine.length > 0) {
        // Determine if it's a header or setting
        if (this.headerCheck(cleanLine)) {
          if (lastHeader !== 'unset') {
            delete objCheck[lastHeader];
          }

          lastHeader = cleanLine.replace(/(\[|\])/g, '');

          if (!obj[lastHeader])
            continue;
        } else {
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

    // Adding in data that isn't in there by default
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

    // Get new schema
    this.parse(newLines);
  }

  public set(header: string, field: string, value: string): void {
    if (!this.ini)
      return;

    const lines: Array<string> = this.ini.split(/\n/i);
    let lastHeader: string = 'unset';
    let foundHeader: number = -1;
    let foundMatch:boolean = false;

    for (let a: number = 0; a < lines.length; a++) {
      let cleanLine = this.cleanComments(lines[a]);

      if (cleanLine.length > 0) {
        // Determine if it's a header or setting
        if (this.headerCheck(cleanLine)) {
          lastHeader = cleanLine.replace(/(\[|\])/g, '');

          if (lastHeader === header)
            foundHeader = a;
        } else {
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

    // Get new schema
    this.parse(newLines);
  }

  public verifyData(): Boolean {
    try {
      if (this.schema && (this.schema['default'] || this.schema['DEFAULT'])) {
        let data;

        if (this.schema['default']) {
          data = this.schema['default'];
        } else {
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
    } catch (e) {
      return false;
    }
  }

  public parse(ini: string): void {
    const lines: Array<string> = ini.split(/\n/i);
    let schema: any = {};

    let lastHeader: string = 'unset';

    lines.forEach(line => {
      let cleanLine = this.cleanComments(line);

      if (cleanLine.length > 0) {
        // Determine if it's a header or setting
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
