import * as fs from 'fs';
import * as moment from 'moment';

export const ErrorLogger = errText => {
    fs.appendFileSync('errorlog.txt', `::: ${moment().format('YYYY-MM-DD HH:mm:ss')} :::\n${errText}\n\n`);
};
