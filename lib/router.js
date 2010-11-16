var print = require("promised-io/process").print;
var ws = require("node-websocket-server/server");

var protocols = require("./protocols").protocols;

//The Router Class Constructor
var Router = exports.Router = function(options){
	this.options = options;
	this.protocols = [];
	this.protocol = {};

	//setup sockets we're going to listen on
	this.createWebSocket();

	//attach to any socket events
	this.attachToWebSocket();

	var prots = options.protocols || protocols;

	//register our protocols
	if (prots){
		prots.forEach(function(p){
			try {
				this.registerProtocol(p);
			}catch(err){
				this.log("Error registering protocol" + err);
			}
		},this);
	}

	//start listening
	this.listen();
}

Router.prototype = {
	listen: function(){
		this.websocket.listen(this.options.port, this.options.host || "127.0.0.1");
	},

	createWebSocket: function(){
		var router = this;
		
		this.websocket = ws.createServer({debug: false, subprotocol: function(connection, upgradeHeader){
			return router.validateConnection(connection, upgradeHeader);
		}});
	},

	attachToWebSocket: function(){
		var router = this;
		this.websocket.addListener("listening", function(connection){
			router.log("WebSocket is listening on ", router.options.port);
		});

		this.websocket.addListener("connection", function(connection){
			connection.addListener("message", function(data){
				router.webSocketMessageParser(connection, data);	
			});
		});

		this.websocket.addListener("request", function(request){
			router.httpMessageHandler(request);
		});

		this.websocket.addListener("close", function(connection){
			router.log("[" + connection.id + "] disconnected.");
		});
	},

	
	registerProtocol: function(protocol){
		this.log("Register Protocol: ");
		var protocol = protocol(this);		
		this.log("     name: " + protocol.name); 
		this.protocols.push(protocol);	
		this.protocol[protocol.name]=protocol;
	},

	webSocketMessageParser: function(connection, data){
		this.log("[" + connection.id + "->R]: WebSocket Data Handler");

		try {
			connection.protocolHandler(connection, data);
		}catch(err){
			this.log("[ERROR] Unable to parse data: " + data + "\r\n\t" + err);

		}
				
	},

	httpMessageHandler: function(request){
		this.log("[C->R]: Http Request Handler");
	},


	validateConnection: function(connection, upgradeHeader){
		var clientProtocol = connection._req.headers['sec-websocket-protocol'] ||  connection._req.headers['sec-websocket-protocol'] ;
		var match=false;

		this.protocols.some(function(protocol){
			match = protocol.acceptProtocol(clientProtocol, connection);
			if (match) {
				connection.protocolHandler = protocol.handleMessage;
				return match;
			}
		});

		return match;
	},

	log: function(msg){
		print("[Router]", msg, "\r");
	},

	inspect: function(obj){
		for (var prop in obj){
			print("obj[" + prop + "]: ", obj[prop]); 
		}
	}

}
