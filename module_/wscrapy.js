

const  he      = require('he');
const request  = require('request')
const fs       = require('fs')
const cheerio  = require('cheerio');
const Path     = require('path');
const download = require('download-file')

function getHead(html){
  const $         = cheerio.load(html);
  let title       = checkUndefined($('title').text());
  let keywords    = checkUndefined($('meta[name="keywords"]').attr('content'));
  let description = checkUndefined($('meta[name="description"]').attr('content'));
  return {title,keywords,description}
}

function clean(str) {
  if (str == null) {
    return
  } else {
    return he.decode(
      str.replace(/\t/g, "")  //remove tab
      .replace(/\n/g, "")     //remove new line
      .replace(/ +</g,'<')    //remove space before open tag
      .replace(/> +/g,'>')    //remove space after close tag
      .replace(/<!--(.|\n)*?-->/g,'') //remove html comment
      );
  }
}

function downloadIMG(uri, dest, filename = uri.match(/([^\/]+$)/g)[0]) {
  let file = filename.match(/\.(?:jpg|jpeg|JPG|png|PNG|gif)/g)?filename:filename+'.jpg'
  let imgPath = dest + file
  return new Promise(function(fullfil,reject){
    request.head(uri, function (err, res, body) {
      'content-type:',
      res.headers['content-type']
      'content-length:',
      res.headers['content-length']
      request(uri).pipe(fs.createWriteStream(imgPath))
        .on('close', () => {
          fullfil(imgPath)
        }).on('error', function (err) {
          reject({imgPath,err})
      });
    });
  })
};

function downloadPDF(url, dist) {
  return new Promise(function (res, rej) {
    download(url, {directory: dist}, function (err, path) {
      if (err) rej({url,err});
      else res(Path.parse(url).base)
    })
  })
}

function zeroPad (d){
  return ("0" + d).slice(-2)
}

function writeHTML(txtbody = '', dest) {
  fs.writeFile(dest, txtbody, function (err) {
    if (err) throw err;
  })
}

function getCSV(path){
  var csv_data = fs.readFileSync(path, { encoding : 'utf8'});
  return  csvjson.toObject(csv_data, { delimiter : ',',  quote: '"'});
}

function regHTML(str1,str2){
  var re = new RegExp(str2.old,"g");
  return str1.replace(re,str2.new)
}

function subcontent(txt,start,end){
  var re1 = new RegExp('(.*?|\n)*?'+start,"s");
  var re2 = new RegExp(end+'(.*)',"s");
  return txt.replace(re1,start).replace(re2,'')
}
const createDir = (dirPath) => {
  fs.mkdirSync(process.cwd() + dirPath, {
    recursive: true
  }, (err) => {
    if (err) console.error('err', err);
    else console.log('done');
  })
}

const checkAttr = (attr) => {
  return typeof attr !== typeof undefined && attr !== false ? true : false
}
const checkUndefined = (attr) => {
  return typeof attr !== typeof undefined && attr !== false ? attr : ''
}

const convertToAbosolute = ( path) => {
  const cleanPath = (path) => {
    if (path.match(/^(\.*\/)/g)) {
      path = path.replace(/^(\.*\/)/g, '')
      return cleanPath(path)
    } else if (path.match(/^(http|https):\/\/.+\.[a-z]{2,5}/g)) {
      return path.replace(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]/g,'/');
    } else {
      return `/${path}`
    }
  }
  return Path.isAbsolute(path) ? path : cleanPath(path)
}
const closeLog =()=>{
  console.log = function () {}
}

module.exports = {
  clean,
  zeroPad,
  getCSV,
  downloadPDF,
  downloadIMG,
  getHead,
  writeHTML,
  regHTML,
  subcontent,
  createDir,
  checkAttr,
  checkUndefined,
  convertToAbosolute,
  closeLog
};