/*
Primary file for de api.
*/

const http = require('http');
const url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;

const server = http.createServer((req, res) => {

    // Get the url and parse it
    var parsedUrl = url.parse(req.url, true)

    // Get path
    var path = parsedUrl.pathname;
    var trimedPath = path.replace(/^\/+|\/+$/g, '');

    //Get the query string as and object
    var qso = parsedUrl.query;

    //Get the HTTP Method
    var method = req.method.toLocaleLowerCase();

    //Get the headers and object
    var headers = req.headers;

    //Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function (data) {
        buffer += decoder.write(data);
    });

    req.on('end', () => {
        buffer += decoder.end();
        // Send response
        res.end('HW');

        console.log(
            '***\nRequested: ', trimedPath,
            '\nWhith this method: ', method,
            '\nQuery string parameters ', qso,
            '\nHeaders: ', headers,
            '\nPayload: ', buffer,
            '\n***');
    })


});

server.listen(4000, () => {
    console.log('Server listening on 4000')
})
