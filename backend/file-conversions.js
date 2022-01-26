import { Float16Array } from '@petamoriken/float16';
import { Buffer } from 'buffer';
import { spawn } from 'child_process';
import { createReadStream } from 'fs';
import { writeFile } from 'fs/promises';
import { platform } from 'os';
import { brotliCompress as _brotliCompress, constants } from 'zlib';
import { promisify } from 'util';
const brotliCompress = promisify(_brotliCompress);

const defaults = {
  factor: 1,
  compression_level: 6,
};

export async function grib2(input, output, options) {
  options = { ...defaults, ...options};
  await writeFile(output, await array_to_data(
    await grib2_to_arr(input),
    v => is_magic_NaN(v) ? -Infinity : v * options.factor,
    options.compression_level,
  ));
}

export async function grib2_speed(inputs, output, options) {
  options = { ...defaults, ...options};
  await gfs_combine_grib(inputs, output, (a, b) => {
    return Math.hypot(a, b) * options.factor;
  }, options.compression_level);
}

export async function grib2_acc(inputs, output, options) {
  options = { ...defaults, ...options};
  await gfs_combine_grib(inputs, output, (a, b) => {
    return (b - a) * options.factor;
  }, options.compression_level);
}

async function gfs_combine_grib(inputs, output, combine_fn, compression_level) {
  let [arrA, arrB] = await Promise.all(inputs.map(grib2_to_arr));

  await writeFile(output, await array_to_data(arrA, (a, i) => {
    let b = arrB[i];
    a = is_magic_NaN(a) ? NaN : a;
    b = is_magic_NaN(b) ? NaN : b;
    let v = combine_fn(a, b);
    return isNaN(v) ? -Infinity : v;
  }, compression_level));
}

async function grib2_to_arr(input) {
  if (typeof input === 'string') {
    input = await new Promise((resolve, reject) => {
      let s = createReadStream(input);
      s.on('open', () => resolve(s));
    });
  }
  return new Promise((resolve, reject) => {
    let child = spawn('wgrib2', [
      '-',
      '-inv', platform() === 'win32' ? 'NUL' : '/dev/null',
      '-bin', '-',
      '-no_header',
      '-order', 'we:sn'
    ], { stdio: [input, 'pipe', 'pipe'] });

    let { stdout, stderr } = child;
    let chunks = [];
    let errs = [];

    stdout.on('data', chunk => chunks.push(chunk));
    stderr.on('data', err => errs.push(err));

    child.on('close', code => {
      if (code === 0) {
        let buf = Buffer.concat(chunks);
        resolve(new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4));
      } else {
        let msg = Buffer.concat(errs).toString();
        reject(`wgrib2 exited with code ${code}:\n${msg}`);
      };
    });

    for (let obj of [child, input, stdout, stderr]) {
      obj.on('error', reject);
    }
  });
}

function is_magic_NaN(val) {
  return val > 9.9989e20;
}

async function array_to_data(arr, transform_fn, compression_level) {
  return await brotliCompress(
    Buffer.from(new Float16Array(arr.map(transform_fn)).buffer),
    { params: { [constants.BROTLI_PARAM_QUALITY]: compression_level } },
  );
}
