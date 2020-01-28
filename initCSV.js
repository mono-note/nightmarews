
const ws = require('./module_/wscrapy');
const fs = require('fs');
const Path = require('path');


const csvPath = Path.parse('/csv/uri.csv')
const csvDir = `.${csvPath.dir}/`
if (!fs.existsSync(csvDir)) {
  ws.createDir(`${csvPath.dir}/`)
  ws.writeHTML('uri', `${csvDir}${csvPath.base}`)
}