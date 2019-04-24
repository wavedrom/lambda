'use strict';

const onml = require('onml');
const fetch = require('node-fetch');
const JSON5 = require('json5');
const bitField = require('bit-field');

const width = 866;

const isa = (obj, opt) => {
  const options = Object.assign({hspace: ((width - 8) >> 5) << 5, lanes: 1}, opt);
  const ml = ['div', {style: 'background-color: white;'}, bitField.render(obj, options)];
  return ml;
};

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
      x: 16, y: 32,
    }, body]]);
};

const getDescriptor = async event => {
  const path = event.path;
  const m = path.match(/^\/github\/(.+)/);
  if (m) {
    const url = `https://raw.githubusercontent.com/${m[1]}`;
    const response = await fetch(url);
    const text = await response.text();
    let data;
    try {
      data = JSON5.parse(text);
    } catch(err) {
      return error(JSON.stringify(err) || 'parse:error');
    }
    if (data && data.reg) {
      const options = {hspace: ((width - 8) >> 5) << 5, lanes: 1};
      return bitField.render(data.reg, options);
    }
  }
  return error(JSON.stringify('path:' + event.path));
};

exports.handler = async (event) => {
  const res = await getDescriptor(event);
  console.log(res);
  const response = {
    headers: {'Content-Type': 'image/svg+xml'},
    statusCode: 200,
    body: onml.stringify(res)
  };
  return response;
};
