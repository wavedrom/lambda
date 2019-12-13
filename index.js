'use strict';

const fetch = require('node-fetch');
const JSON5 = require('json5');
const wavedrom = require('wavedrom');

const width = 866;

const getSVG = (w, h) => ['svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  width: w,
  height: h,
  viewBox: [0, 0, w, h].join(' ')
}];

const error = body => {
  const w = width;
  const h = 64;
  return getSVG(w, h)
    .concat([['rect', {
      style: 'fill-opacity:0.1;fill:hsl(80,100%,50%)',
      x: 8, y: 8,
      width: w - 16, height: h - 16
    }]])
    .concat([['text', {
      x: 16, y: 32
    }, body]]);
};

const getDescriptor = async event => {
  const path = event.path;
  const dataGithub = path.match(/^\/github\/(.+)/);
  const dataBase64 = path.match(/^\/base64\/(.+)/);
  let data;

  if (dataGithub) {
    // Fetch the Json from Github
    try {
      const url = `https://raw.githubusercontent.com/${dataGithub[1]}`;
      const response = await fetch(url);
      data = await response.text();
    } catch (err) {
      return error(JSON.stringify(err) || 'github:fetch:error');
    }
  } else if (dataBase64) {
    // Decode the Base64 in the link
    const base64Data = dataBase64[1];
    try {
      data = new Buffer(base64Data, 'base64').toString('ascii');
    } catch (err) {
      return error((JSON.stringify(err) || 'base64:decode:error') + base64Data);
    }
  } else {
    // Json is in the link
    try {
      data = decodeURIComponent(event.path);
      data = data.split('/').join('');
    } catch (err) {
      return error((JSON.stringify(err) || 'decodeURI:error:') + data);
    }
  }

  try {
    data = JSON5.parse(data);
  } catch (err) {
    return error((JSON.stringify(err) || 'parse:error:') + data);
  }

  if (typeof data !== 'object') {
    return error('data:error:' + data);
  }

  // Finally, render the Json5
  data.config = {hspace: width};
  return wavedrom.renderAny(0, data, wavedrom.waveSkin);
};

exports.handler = async (event) => {
  const res = await getDescriptor(event);
  const response = {
    headers: {'Content-Type': 'image/svg+xml'},
    statusCode: 200,
    body: wavedrom.onml.stringify(res)
  };
  return response;
};
