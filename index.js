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
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });


    req.on('end', () => {
        buffer += decoder.end();
        //Chose the handler this request should go. If not execute not found handler
        var choseHandler = typeof (router[trimedPath]) !== 'undefined' ? router[trimedPath] : handlers.notFound;
        //Construct the data object to sended to the handler
        var data = {
            'trimedPath': trimedPath,
            'method': method,
            'qso': qso,
            'headers': headers,
            'payload': buffer,
        }

        //Routh the reques specified on the router
        choseHandler(data, function (statusCode, payload) {
            //Use the status code callback by the handler, or default 200
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            //Use the payload called back by the handler, or default empty object
            payload = typeof (payload) == 'object' ? payload : {};

            //Convert the payload in to a string
            var payloadString = JSON.stringify(payload);

            //Return the response
            res.setHeader('Content-Type', 'aplication/json')
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log(
                '***\nRequested: ', trimedPath,
                '\nWhith this method: ', method,
                '\nQuery string parameters ', qso,
                '\nHeaders: ', headers,
                '\nPayload: ', buffer,
                '\nSending back : ', payloadString,
                '\n***');
        })

    })




});

server.listen(4000, () => {
    console.log('Server listening on 4000')
})


// Define the handlers
var handlers = {};

// Sample handler
handlers.sample = function (data, callback) {
    //Callback http status code, and pyload object
    callback(406, { 'name': 'sample hanldres' })
};

// Not Found handler
handlers.notFound = function (data, callback) {
    callback(404)

};

// Define a request router
var router = {
    'sample': handlers.sample
}
