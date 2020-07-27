$(function(){

	// This demo depends on the canvas element
	if(!('getContext' in document.createElement('canvas'))){
		alert('Sorry, it looks like your browser does not support canvas!');
		return false;
	}

	// The URL of your web server (the port is set in app.js)
	var url = 'http://cibsr-x23.stanford.edu:8080';

	var doc = $(document),
		win = $(window),
		canvas = $('#paper'),
		ctx = canvas[0].getContext('2d'),
		instructions = $('#instructions');
	
	// Generate an unique ID
	var id = Math.round($.now()*Math.random());
	
	// A flag for drawing activity
	var drawing = false;

	var clients = {};
	var cursors = {};

	var socket = io.connect(url);
	
	socket.on('moving', function (data) {
		
		if(! (data.cid in clients)){
			// a new user has come online. create a cursor for them
			cursors[data.cid] = $('<div class="cursor">').appendTo('#cursors');
		}
		
		// Move the mouse pointer
		cursors[data.cid].css({
			'left' : data.x,
			'top' : data.y
		});
		
		// Is the user drawing?
		if(data.drawing && clients[data.id]){
			
			// Draw a line on the canvas. clients[data.id] holds
			// the previous position of this user's mouse pointer
			
			drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y);
		}
		
		// Saving the current client state
		clients[data.id] = data;
		clients[data.id].updated = $.now();
	});

	// An example timeout call from the client (browser)
	// to let server know when to initiate state save. 
	//setTimeout(function(){
	//	socket.emit('timeout', {id: id});
//		
//		ctx.fillStyle = "blue";
//		ctx.font = "bold 16px Arial";
//		var text = "Client ID: " + id + "\n (C) Manish Saggar";
//		ctx.fillText(text, 10, 20);
//		var image = canvas[0].toDataURL("image/png").replace("image/png", "image/octet-stream");
//
//		var filename = 'node-drawing-game-id-' + id + '.png';	
//		// Option 01: Provide a link to user so that pre-determined file name
//		// can be set for the downloaded file	
//		document.body.innerHTML = "<a id='download-as' download='" + filename + "' href='" + image + "'> Click here to download output as PNG</a>";
//		var elem = document.getElementById("download-as");
//		elem.click();
//
//		// Option 02: Redirect user to a PNG file with auto pop up to save file as ...
//		// window.location.href = image;
  //      }, 5000);

	var prev = {};
	
	canvas.on('mousedown',function(e){
		e.preventDefault();
		drawing = true;
		prev.x = e.pageX;
		prev.y = e.pageY;
		
		// Hide the instructions
		instructions.fadeOut();
	});
	
	doc.bind('mouseup mouseleave',function(){
		drawing = false;
	});

	var lastEmit = $.now();

	doc.on('mousemove',function(e){
		if($.now() - lastEmit > 30){
			socket.emit('mousemove',{
				'x': e.pageX,
				'y': e.pageY,
				'drawing': drawing,
				'id': id
			});
			lastEmit = $.now();
		}
		
		// Draw a line for the current user's movement, as it is
		// not received in the socket.on('moving') event above
		
		if(drawing){
			
			drawLine(prev.x, prev.y, e.pageX, e.pageY);
			
			prev.x = e.pageX;
			prev.y = e.pageY;
		}
	});

	// Remove inactive clients after 1000 seconds of inactivity
	setInterval(function(){
		
		for(ident in clients){
			if($.now() - clients[ident].updated > 10000){
				
				// Last update was more than 10 seconds ago. 
				// This user has probably closed the page
				
				cursors[ident].remove();
				delete clients[ident];
				delete cursors[ident];
			}
		}
		
	},1000000);

	function drawLine(fromx, fromy, tox, toy){
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.stroke();
	}

});
