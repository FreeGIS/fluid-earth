import { execFile as _execFile } from 'child_process';
import { DateTime } from "luxon";
import { mkdir } from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import * as util from './utility.js';
import fs from 'fs/promises';
import DomParser from 'dom-parser';
import { debug } from 'console';

const forecastHours = 6;
const script = path.join('data', 'scripts', 'netcdf-to-fp16.js');
const execFile = promisify(_execFile);

const outputPath = path.join(util.OUTPUT_DIR, 'GEOS/');

const geosProps = {
    bytesPerFile: 1661184,
    width: 1152,
    height: 721,
    intervalInHours: 1,
    forecastIntervalInHours: 6,
    projection: 'GEOS',
};

const hoursForwardDefault = 30;
const hoursForward00 = 240;
const hoursForward12 = 120;


const geosVars = [
    {
        dataDir: 'geos-sulfur-dioxide-surface-mass/',
        varName: 'SO2SMASS',
        factor: 10e9,
        datasetBase: {
            name: 'Sulfur Dioxide Surface Mass',
            description: 'Sulfur Dioxide Surface Mass',
            path: util.browserPath(outputPath),
            unit: 'ug/m^3',
            originalUnit: 'ug/m^3',
            domain: [0, 100],
            colormap: 'SO2_MASS',
            ...geosProps
        }
    },
    {
        dataDir: 'geos-carbon-monoxide-surface-concentration/',
        varName: 'COSC',
        datasetBase: {
            name: 'Carbon Monoxide Surface Concentration',
            description: 'Carbon Monoxide Surface Concentration',
            path: util.browserPath(outputPath),
            unit: 'ppm',
            originalUnit: 'ppm', // TODO: allow for PPB
            domain: [1, 1000],
            colormap: 'CO_SURFACE',
            ...geosProps
        }
    },
    {
        dataDir: 'geos-dust-surface-mass-concentration/',
        varName: 'DUSMASS',
        factor: 10e9,
        datasetBase: {
            name: 'Dust Surface Mass Concentration',
            description: 'Dust Surface Mass Concentration',
            path: util.browserPath(outputPath),
            unit: 'ug/m^3',
            originalUnit: 'ug/m^3',
            domain: [0, 900],
            colormap: 'DUST_MASS',
            ...geosProps
        }
    }
]
const [inventory, writeAndUnlockInventory] = await util.lockAndReadInventory();

function contains(dom, selector, text) {
    var elements = dom.getElementsByTagName(selector);
    return [].filter.call(elements, function (element) {
        return RegExp(text).test(element.textContent);
    });
}
async function findDataFromIndex(dataset, year, month, day, hour, forecast, indexPageURL) {
    var parser = new DomParser();
    const indexPageFilename = await util.download(indexPageURL, true);

    var html = await fs.readFile(indexPageFilename, 'utf8');

    var dom = parser.parseFromString(html);
    var matchingAnchor = contains(dom, "a", `${forecast}.${year}${month}${day}_${hour}00z.nc4`);

    var urlName = matchingAnchor[0].attributes[0]['value'];

    dataset.filenamePrefix = urlName.substring(0, urlName.indexOf("." + forecast));

    return urlName;
}




async function downloadGEOSData(dataset, year, month, day, hour, datetime, hourShift) {

    const forecast = "inst1_2d_hwl_Nx";
    const baseURL = 'https://portal.nccs.nasa.gov/datashare/gmao/geos-fp/das/' +
        `Y${year}/M${month}/D${day}/H${hour}/`;

    const nxtDatetime = datetime.plus({ hours: hourShift });
    const nxt_year = nxtDatetime.year;
    const nxt_month = nxtDatetime.toFormat('LL');
    const nxt_day = nxtDatetime.toFormat('dd');
    const nxt_hour = nxtDatetime.toFormat('HH')

    const forecastNameSyntax = `GEOS.fp.fcst.${forecast}.${year}${month}${day}_${hour} +
        ${nxt_year}${nxt_month}${nxt_day}_${nxt_hour}00z.V01.nc4`;

    const inputFile = await util.download(baseURL + forecastNameSyntax, true);

    return inputFile;
}

for (const geosVar of geosVars) {
    const factor = geosVar.factor ?? 1;
    const outputPath = path.join(util.OUTPUT_DIR, geosVar.dataDir);
    const geosVarName = geosVar.varName;
    await mkdir(outputPath, { mode: '775', recursive: true });

    let dataset = inventory.find(d => d.path === util.browserPath(outputPath));
    let datetime;

    if (dataset) {
        datetime = DateTime.fromISO(dataset.end, { zone: 'utc' }).plus({ hour: forecastHours });
    } else {
        const now = DateTime.utc();
        datetime = DateTime.utc(now.year, now.month, now.day).minus({ days: 1 });
        inventory.push(dataset = geosVar.datasetBase);
    }

    const year = datetime.year;
    const month = datetime.toFormat('LL');
    const day = datetime.toFormat('dd');
    const hour = datetime.toFormat('HH')

    for (let f = 0; f < forecastHours; f++) {
        const inputFile = await downloadGEOSData(dataset, year, month, day, hour);
        const filename = datetime.plus({ hours: f }).toISO() + '.fp16';
        const outputFile = util.join(outputPath, filename);

        util.log('Converting NETCDF to fp16', inputFile, outputFile);
        await execFile('node', [script, inputFile, outputFile, geosVarName, factor]);
    }

    for (const prop in geosVar.datasetBase) dataset[prop] = geosVar.datasetBase[prop];

    dataset.path = util.browserPath(outputPath);
    dataset.start = dataset.start ?? datetime;
    dataset.end = datetime;

}

await writeAndUnlockInventory(inventory);
