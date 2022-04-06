import axios from 'axios';
import fs from 'fs';
import type { Arguments, CommandBuilder } from 'yargs';

/*
IMT HASH FUNCTION GO EXAMPLE
 coefficients := [8]int{ 2, 3, 5, 7, 11, 13, 17, 19 }
 for each incoming byte, ib:
   for each byte of the hash, h
     h[i] = ((h[i-1] + ib) * coefficient[i]) % 255
 in the case where i-1 == -1, h[i-1] should be 0.
*/
/*
  Sample File for testing.
 ./build/cli.js hash  "https://pdfgeneratorapi.com/example-documents/52272/pdf"
*/

type Options = {
  name: string;
  url: string;
  destination: string;
  throttle?: number;
};

export const command: string = 'hash <url>';
export const desc: string =
  'Fetch a <URL> file, compresses as a hash and then converts to a hexadecimal string and save it to <DESTINATION> path.';

function toHexString(byteArray: number[]) {
  return Array.from(byteArray, (byte) => {
    return ('0' + (byte & 0xff).toString(16)).slice(-2);
  }).join('');
}

const sleep = (delay?: number) => {
  return new Promise(function (resolve) {
    setTimeout(resolve, delay);
  });
};

function imtHash(data: number[]) {
  const COEFFICIENT = [2, 3, 5, 7, 11, 13, 17, 19];

  let hash: number[] = [];
  let i: number;

  for (i = 0; i < COEFFICIENT.length; i++) {
    data.forEach((ib) => {
      if (i - 1 == -1) hash[i - 1] = 0;
      hash[i] = ((hash[i - 1] + ib) * COEFFICIENT[i]) % 255;
    });
  }
  return toHexString(hash);
}

async function fetchPath(url: string, throttle?: number) {
  console.log('Fetching file.');
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    method: 'GET',
  });
  if (throttle) {
    axios.interceptors.response.use(async (response) => {
      await sleep(throttle);
    });
  }
  return imtHash(res.data);
}

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs
    .options({
      throttle: {
        type: 'number',
        description: 'Throttle value for the URL.',
      },
      destination: {
        type: 'string',
        description: 'Destination Path',
        demandOption: true,
      },
    })
    .positional('url', { type: 'string', demandOption: true });

export const handler = async (argv: Arguments<Options>) => {
  const { url, throttle, destination } = argv;
  const hexHash = await fetchPath(url, throttle);
  console.log('Hexadecimal value:', hexHash);
  console.log(`File being sent to ${destination}`);
  fs.writeFileSync(destination, hexHash);
  console.log(`hexadecimal saved in: ${destination}`);

  console.log('Convertion finished.');
  process.exit(0);
};
