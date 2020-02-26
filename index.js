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
let root
const imgPath = 'assets'
const templateFile = './template/temp.html'
const dist = 'dist'
const dPDF = '_pdf'
const ignoreIMG = [
  'b_map.gif',
  'pagetop.gif',
  'icn_pdf.gif',
  'get_adobe_reader.png',
  'icon_news_news.gif',
  'icon_news_setl.gif'
]

var doCheerio = function (html, uri) {
  let record_PDF = [],
    record_IMG = []
  uri = uri.match(/.html/g) ? uri : uri +'index.html';
  root = new URL(uri);
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

  let objHtml = {
    meta: meta,
    breadCrumb: breadCrumb
  }
  ////// Contents
  let contentID = '#main'
  let tempText = ''

  $(`${contentID} *`).each(function(){

    if (true) {
      // getIMG($(this), record_IMG) //get path image
      // getPDF($(this), record_PDF) //get path PDF
    }

    // Content Here


  })

  // write file
  exportToFile(tempText, objHtml)

  //download PDF
  Promise.all(record_PDF).then((data) => {
    data.map((pdf)=>{
      let uri =  `${root.origin}${pdf.dir}/${pdf.base}`
      let dist = `${dPDF}${pdf.dir}/`
      ws.downloadPDF(uri, dist)
        .then(v => console.info(colors.cyan('PDF DONE:'), v))
        .catch(data => console.error(colors.bgRed(data.url), '\n', colors.bgRed(new Error(data.err))));
    })
  })

  //download IMG
  Promise.all(record_IMG).then((data) => {
    data.map((img) => {
      ws.downloadIMG(img.uri, img.dest)
      .then(v => console.info(colors.green('IMG DONE:'), v))
      .catch(v => console.error(colors.bgRed(v.url), '\n', colors.bgRed(new Error(v.err))));
    })

  })

}

const getIMG = (img, record_IMG) => {
  if (img.is('img')) {
    let src = img.attr('src')
    src = ws.convertToAbosolute(src)
    let alt = ws.checkUndefined(img.attr('alt'))
    let cap = ''
    let filename = Path.parse(src).base
    //outputIMG
    let outputIMG = `${imgPath}${Path.parse(root.pathname).dir}/`
    ws.createDir(`/${outputIMG}`)
    // ignore IMG
    if (!ignoreIMG.find(ig => ig === filename)) {
      record_IMG.push({
        uri: `${root.origin}${src}`,
        dest: outputIMG
      })
    }
  }
}
const getPDF = (pdf, record_PDF) => {
  if (pdf.is('a') && ws.checkAttr(pdf.attr('href')) && pdf.attr('href').match(/\.pdf/)) {
    record_PDF.push(Path.parse(ws.convertToAbosolute(pdf.attr('href'))))
  }
}

const exportToFile = (tempText, objHtml) => {
  let dummy = fs.readFileSync(templateFile, 'utf8', () => {})
  let fileLocation = Path.parse(root.pathname)

  dummy = dummy.replace(/#######CONTENT/g, tempText)
    .replace(/##title/g, `'${objHtml.meta.title}'`)
    .replace(/##description/g, `'${objHtml.meta.description}'`)
    .replace(/##keyword/g, `'${objHtml.meta.keyword}'`)

  ws.createDir(`/${dist}${fileLocation.dir}`)
  ws.writeHTML(eol.crlf(dummy), `${dist}${root.pathname}`)

}