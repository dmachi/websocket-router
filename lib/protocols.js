var print = require("promised-io/process").print;
var when = require("promised-io/promise").when;
var json = require("commonjs-utils/json");

var tunguska = exports.tunguska = function(router){

	var hub=require('tunguska/hub');

	return {
		name: "tunguska",
		acceptProtocol: function(protocol,connection){
			if (protocol.match(/^wspubsub\/?.*/i)){
				router.log("[Tunguska] Accept websocket-protocol for new connection.");
				return protocol;
			}else{
				return false;
			}
		},

		handleMessage: function(connection, data){
			var data = data.toString('utf8').trim();
			var message = json.parse(data);
			router.log("[Tunguska] Message: " + data);

			var listener = function(msg){
				var msg = json.stringify(msg);
				router.log("[Tunguska] [R->" + connection.id + "] " + msg);
				connection.write(msg);
			}

			if (message.channel){
				hub.fromClient(connection.id).publish(message.channel, message.payload);
	 		} 

			if (message.subscribe){
				when(hub.fromClient(connection.id).subscribe(message.subscribe,listener), function(){
					router.log("[Tunguska] Connection " + connection.id + " subscribed to " + message.subscribe);
				});
			} 

			if (message.unsubscribe){
				when(hub.fromClient(connection.id).unsubscribe(message.unsubscribe,listener), function(){
					router.log("[Tunguska] Connection " + connection.id + " unsubscribed from " + message.unsubscribe);
				});
			} 
		},

		closeConnection: function(connection){
			//TODO unsubscribe or let queue?
		}	
	}	
}

exports.protocols = [tunguska];

