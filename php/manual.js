const os = require('os')
const request = require('request');
const exec = require('child_process').exec;
const htmlparser = require("htmlparser");

module.exports = {}

module.exports.getLocalPHPFunction = function (functionName) {
  try {
    let definition = '';
    exec('php --rf ' + functionName.replace('-', '_'), function (err, stdout, stderr) {
      definition = stdout;
    });
    return definition;
  } catch {
    return 'Error';
  }
}

function domSearch(dom) {
  let definitionString = ''
  function domDFS(dom) {
    if (dom != null && dom.length > 0) {
      dom.forEach(function (child) {
        if (child.type == 'text')
          definitionString += child.data;
        else {
          domDFS(child.children);
        }
      });
    }
    else {
      return;
    }
  }
  domDFS(dom)
  return definitionString
}

module.exports.getPHPFunction = function (functionName) {
  request('http://www.php.net/manual/en/function.' + functionName + '.php', function (error, response, body) {
    const description = body.substring(body.indexOf('refsect1 description'), body.indexOf('refsect1 parameters'));
    const handler = new htmlparser.DefaultHandler();
    const parser = new htmlparser.Parser(handler);
    parser.parseComplete(description);
    const definition = handler.dom.reduce((acc, element) => {
      if (element.name === 'p') {
        acc += domSearch(element.children)
      }
      return acc;
    }, '');
    return definition + "\n";
  })
}