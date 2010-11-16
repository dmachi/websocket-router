//require.paths.shift(process.env.RESIDE_HOME + "/lib");
var print = require('promised-io/process').print;
var repl = require('repl');
var ws = require("node-websocket-server/server");
var Router = require("./router").Router;

var options = {
	port: 9901,
	host: "127.0.0.1"
}

if(require.main == module){
	//TODO mixin command line options
	router = new Router(options);
	repl.start("> "); 
}
