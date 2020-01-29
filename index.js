const ws        = require('./module_/wscrapy');
const cheerio   = require('cheerio');
const Nightmare = require('nightmare');
const async     = require("async");
const csvjson   = require('csvjson');
const fs        = require('fs');
const eol       = require('eol')
const html2pug  = require('html2pug')
const Path      = require('path');
const partlist  = require('./partlist')
const colors    = require('colors/safe');

/////// PATH CSV for URL
const csvPath ='./csv/uri.csv'

let csv_data = fs.readFileSync(csvPath, {  encoding: 'utf8'});
const urls = csvjson.toObject(csv_data).map(v => v.uri);

/////// BEGIN
const nightmare = Nightmare()
let raw_html = []

function load(url, callback) {
  nightmare
    .goto(url)
    .wait('html')
    .evaluate(() => document.querySelector('html').innerHTML)
    .run(function (err, body) {
      if (err) {
        console.log(err);
      }
      raw_html.push(body)
      callback()
    })
}
async.eachSeries(urls, load, function (err, data) {
  raw_html.forEach((html, idx) => {
    doCheerio(html, urls[idx])
  })
})

////// Var

const imgPath = 'assets'
const templateFile = './template/temp.html'
const dist = 'dist'
const dPDF = '_pdf'

var doCheerio = function (html, uri) {
  let list_PDF = []
  uri = uri.match(/.html/g) ? uri : uri +'index.html';
  let root = new URL(uri);
  let path = Path.parse(root.pathname)

  const $ = cheerio.load(html);

  ////// META
  let meta = ws.getHead(html)

  /// Breadcrumb
  let breadCrumb = $('#topicpath ul').children().map(function () {
    if ($(this).children().is('a')) {
      let href = ws.checkUndefined($(this).find('a').attr('href'))
      href = href == `${root.origin}/` ? '/' : href
      href = !Path.isAbsolute(href) ? `/${href}` : href
      return {
        text: $(this).children().text(),
        href: href
      }
    } else {
      return {
        text: $(this).text()
      }
    }
  }).get()

  ////// Contents
  let contentID = '#main'

  $(`${contentID} *`).each(function(){

    //download image
    if($(this).is('img')){
      let src = $(this).attr('src')
      src = ws.convertToAbosolute(src)
      let alt = ws.checkUndefined($(this).attr('alt'))
      let cap = ''
      //outputIMG
      let outputIMG = `${imgPath}${path.dir}/`
      ws.createDir(`/${outputIMG}`)
      ws.getIMG(`${root.origin}${src}`, outputIMG)
      console.log(colors.green('IMG DONE:'), Path.parse(src).base);
    }

    if ($(this).is('a')){
      if(ws.checkAttr($(this).attr('href'))) {
        let href = $(this).attr('href')
        href = ws.convertToAbosolute(href)
        if (href.match(/\.pdf/)) {
          let pdfPath = Path.parse(href)
          list_PDF.push(pdfPath)
        }
      }
    }

  })

  //download PDF
  Promise.all(list_PDF).then((data) => {
    data.map((pdf)=>{
      let uri =  `${root.origin}${pdf.dir}/${pdf.base}`
      let dist = `${dPDF}${pdf.dir}/`
      ws.downloadPDF(uri, dist)
        .then(v => console.log(colors.cyan('PDF DONE:'), v))
        .catch(data => console.log(colors.bgRed(data.url), '\n', colors.bgRed(new Error(data.err))));
    })
  })

  // write file
  let dummy = fs.readFileSync(templateFile, 'utf8', () => {})
  // dummy = dummy.replace(/#######CONTENT/g, tempText)
  //   .replace(/##title/g, `'${meta.title}'`)
  //   .replace(/##description/g, `'${meta.description}'`)
  //   .replace(/##keyword/g, `'${meta.keyword}'`)
  //   .replace(/##breadCrumb/g, JSON.stringify(breadCrumb))
  //   .replace(/##navYears/g, JSON.stringify(navYears))

  // ws.createDir(root.pathname)
  // ws.writeHTML(eol.crlf(dummy), `${root.pathname.slice(1)}/${filename.replace(/\.html/g,'')}.pug`)
}

