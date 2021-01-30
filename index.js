/*
Primary file for de api
*/

const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {

    // Get the url and parse it
    var parsedUrl = url.parse(req.url, true)

    // Get path
    var path = parsedUrl.pathname;
    var trimedPath = path.replace(/^\/+|\/+$/g, '');

    //Get the query string as and object
    var qso = parsedUrl.query;

    //Get the HTTP Metho
    var method = req.method.toLocaleLowerCase();

    //Get the headers and object
    var headers = req.headers;
    // Send response
    res.end('Hello World')

    console.log(
        'Requested: ' + trimedPath + 
        '\nWhith this method: ' + method +
        '\nQuery string parameters ', qso, 
        '\nHeaders: ', headers);
})

server.listen(4000, () => {
    console.log('Server listening on 4000')
})
