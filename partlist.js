module.exports = {
  title: (txt) => {
    return `<h1>${txt}</h1`;
  },
  iframe_map:(src) => {
    return '<div class="box-map-iframe"><iframe src="' + src + '" height="300"></iframe></div>'
  }
};