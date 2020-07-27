// initializing the main server requirements
var express = require('express');
var redisDB = require('redis');
var mkdirp = require('mkdirp');
var moment = require('moment');
var fs = require('fs');
var util = require('util');
var app = express();
var syncFor = require('./syncFor');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var numPlayers = 0;
var picWords = ["Graduate", "Snore", "Accelerate", "Salute", "Whisper", "Boil", "Vote", "Redial", "Pinpoint"];
var zigWords = ["Circle", "Triangle", "Crescent", "Rectangle", "Oval", "Square", "Pentagon", "Hexagon", "Diamond" ];
var fixationDur = [9000,8000,11000,12000,8000,9000,12000,11000,10000];
var picBlockDur = 30000;
var zigBlockDur = 30000;
var instructionDur = 20000;
var scannerCountDownDur = 5000;
var inspirationBlockDur = 30000;
var runNumber = 0;
var i = 0;
var totalTrialDurInSec = 240;
var clients = {};
var clientSocketQueue = {};
var now = new Date();
var imgFolder;
var log_file = fs.createWriteStream(__dirname + '/logger_' + moment().format('MMMM DD YYYY HH mm ss') + '.log', {flags : 'w'});
var log_stdout = process.stdout;

//console.log("num of players = " + numPlayers);
// check if a client is connected
io.on('connection', function(client) {
      // when the new client joins
      client.on('join', function(data){
                clientSocketQueue[numPlayers] = client;
                client.playerId = data.pid;
                client.scannerId = data.sid;
                client.runId = data.rid;
                clients[numPlayers] = data.pid;
                numPlayers += 1;
                var timeStamp = new Date();
                console.log('Time = ' + timeStamp  + ' Client id = ' + client.playerId + ' on scanner = ' + client.scannerId + ' is connected for run = ' + client.runId);
                console.log('Number of players = ' + numPlayers);
                //numPlayers += 1;
                
                if(numPlayers>3){
                    console.log('Can\'t allow more than three connections. Refusing client = ' + client.playerId + ' on scanner = ' +  client.scannerId);
                    client.emit('connRefused');
                }

                
                if(numPlayers == 3){
                    startTime = moment();
                    console.log('Ready to start the scanners... Shooting them in 3... 2.. 1.');

                    // show instructions first
                    //client.broadcast.emit('showInstructions');
                    //client.emit('showInstructions');
                    io.sockets.emit('showInstructions');
                    console.log('Clients are asked to show instructions');
                
                    // create a folder to save the pictures
                    setTimeout(function(){
                               imgFolder = 'team_pictionary_' + moment().format('MMMM DD YYYY HH mm ss');
                               console.log('creating a folder to save data' + imgFolder);
                               mkdirp(imgFolder, function(err){
                                      console.log('Error creating the folder = ' + imgFolder + ' err = ' + err);
                                      });                           
                           }, instructionDur - 1000);
                    
                    // t=0, wait for 5 seconds, then start the scanners
                    setTimeout(function(){
                            //client.broadcast.emit('StartScanners');
                            //client.emit('StartScanners');
                          io.sockets.emit('StartScanners');
                          //now = new Date();
                          console.log('Clients are asked to start scanners at ' + moment().format());
                          }, instructionDur);

                    // following will give us the initial fixation of 10+5 seconds
                    setTimeout(function(){
                               io.sockets.emit('showFixation');
                               //now = new Date();
                               console.log('Clients are asked to show fixation ' + moment().format());
                               }, instructionDur + scannerCountDownDur);
                
                    //console.log(" length of words  " + picWords.length);
                
                   if(client.runId == 1){
                     picWords = ["Graduate", "Snore", "Accelerate"];
                     zigWords = ["Sprial-Square", "Sprial-Circle", "Sprial-Triangle"];
                } else if (client.runId == 2) {
                     picWords = ["Salute", "Whisper", "Boil"];
                     zigWords = ["Sprial-Square", "Sprial-Circle", "Sprial-Triangle"];
                } else if (client.runId == 3) {
                     picWords = ["Vote", "Redial", "Pinpoint"];
                     zigWords = ["Sprial-Square", "Sprial-Circle", "Sprial-Triangle"];                
                   }
                
                    // t=5, scanners are started and the fixation is already displayed
                setTimeout(function(){
                           
                           
                  syncFor(0, picWords.length, "start", function(i, status, call){
                        if (status === "done") {
                            runNumber += 1;
                            numPlayers = 0;
                            //now = new Date();
                            console.log("All words are drawn i = " + i + " at " + moment().format());
                            io.sockets.emit('endExperiment');
                            console.log('Clients are asked to end experiment at ' + moment().format());
                            if (runNumber < 3){
                              io.sockets.emit('closeAndReopen');
                            }
                            }
                        else {
                            currTime = moment();
                            console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                            console.log("Next word at i = " + i + " word: " + picWords[i] + " time: " + moment().format());
                            
                            // here we will start phase I (ideation) of the task, i.e., to do the drawing independently (total duration per trial = 80s)
                            // now we can start pictionary right away
                            setTimeout(function(){
                                       //client.broadcast.emit('picBlockInd', {'word': picWords[0]});
                                       //client.emit('picBlockInd');
                                       io.sockets.emit('picBlockInd', {'word': picWords[i]});
                                       //now = new Date();
                                       console.log('Clients are asked to start independent Pictionary block at ' + moment().format());
                                       currTime = moment();
                                       console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                                       }, fixationDur[i]);
                            
                            // wait for 30 s zigzag block, then start fixation again
                            setTimeout(function(){
                                       //client.broadcast.emit('showFixation');
                                       //client.emit('showFixation');
                                       io.sockets.emit('showFixationAndSave', {'word': picWords[i], 'cond': 'indep'});
                                       //now = new Date();
                                       console.log('Clients are asked to show fixation and save data at ' + moment().format());
                                       currTime = moment();
                                       console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                                       }, fixationDur[i] + picBlockDur);
                            
                            // wait for 30 s pictionary block, then start first pictionary block
                            setTimeout(function(){
                                       //client.broadcast.emit('zigBlockInd', {'word': zigWords[0]});
                                       //client.emit('zigBlockInd');
                                       io.sockets.emit('zigBlockInd', {'word': zigWords[i]});
                                       //now = new Date();
                                       console.log('Clients are asked to start independent Zigzag block at ' + moment().format());
                                       currTime = moment();
                                       console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                                       }, fixationDur[i] + picBlockDur + fixationDur[i]);
                            
                            // wait for 30 s zigzag block, then start fixation again
                            setTimeout(function(){
                                       //client.broadcast.emit('showFixation');
                                       //client.emit('showFixation');
                                       io.sockets.emit('showFixationAndSave', {'word': zigWords[i], 'cond': 'indep'});
                                       //now = new Date();
                                       console.log('Clients are asked to show fixation and save data at ' + moment().format());
                                       currTime = moment();
                                       console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                                       }, fixationDur[i] + picBlockDur + fixationDur[i] + zigBlockDur);
                            
                            
                            // here we will start phase II (inspiration/consolidation) of the task, i.e., observing and highlighting "interesting" aspects (total duration per trial = 30s) and also visualize a better design(?)
                            
                            setTimeout(function(){
                                       // we are sending the word and playerids, so that the client and construct the respective URL and download the picture
                                       
                                       io.sockets.emit('inspirationPhase', {'word': picWords[i],
                                                       'playerid1': clients[0],
                                                       'playerid2': clients[1],
                                                       'playerid3': clients[2]});
                                       //now = new Date();
                                       console.log('Clients are asked to start the inspiration phase at ' + moment().format());
                                       currTime = moment();
                                       console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                                       }, fixationDur[i] + picBlockDur + fixationDur[i] + zigBlockDur + fixationDur[i]);
                            
                            setTimeout(function(){
                                       io.sockets.emit('showFixationAndSave', {'word': picWords[i], 'cond': 'inspire'});
                                       //now = new Date();
                                       console.log('Inspiration phase: Clients are asked to show fixation and save data at ' + moment().format());
                                       currTime = moment();
                                       console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                                       }, fixationDur[i] + picBlockDur + fixationDur[i] + zigBlockDur + fixationDur[i] + inspirationBlockDur);
                            
                            
                            setTimeout(function(){
                                       if(i == 0 || i == 3 || i == 6) {
                                        clientSocketQueue[0].emit('coopDraw', {'word': picWords[i], 'clean': 1, 'artist':1});
                                        clientSocketQueue[1].emit('coopObserve', {'word': picWords[i], 'clean': 1, 'artist':1});
                                        clientSocketQueue[2].emit('coopObserve', {'word': picWords[i], 'clean': 1, 'artist':1});
                                       } else if(i== 1 || i == 4 || i == 7) {
                                        clientSocketQueue[1].emit('coopDraw', {'word': picWords[i], 'clean': 1, 'artist':2});
                                        clientSocketQueue[2].emit('coopObserve', {'word': picWords[i], 'clean': 1, 'artist':2});
                                        clientSocketQueue[0].emit('coopObserve', {'word': picWords[i], 'clean': 1, 'artist':2});
                                       } else if (i== 2 || i == 5 || i == 8) {
                                        clientSocketQueue[2].emit('coopDraw', {'word': picWords[i], 'clean': 1, 'artist':3});
                                        clientSocketQueue[0].emit('coopObserve', {'word': picWords[i], 'clean': 1, 'artist':3});
                                        clientSocketQueue[1].emit('coopObserve', {'word': picWords[i], 'clean': 1, 'artist':3});
                                       }
                                       currTime = moment();
                                       console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                                       }, fixationDur[i] + picBlockDur + fixationDur[i] + zigBlockDur + fixationDur[i] + inspirationBlockDur + fixationDur[i]);
                            
                            setTimeout(function(){
                                        io.sockets.emit('showFixationAndSaveCoop', {'word': picWords[i], 'cond': 'coop'});
                                        //now = new Date();
                                        console.log('Clients are asked to show fixation and save data at ' + moment().format());
                                       currTime = moment();
                                       console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                                       }, fixationDur[i] + picBlockDur + fixationDur[i] + zigBlockDur + fixationDur[i] + inspirationBlockDur + fixationDur[i] + picBlockDur);
                            
                            setTimeout(function(){
                                       if(i == 0 || i == 3 || i == 6) {
                                        clientSocketQueue[0].emit('coopObserve', {'word': picWords[i], 'clean': 0, 'artist':2});
                                        clientSocketQueue[1].emit('coopDraw', {'word': picWords[i], 'clean': 0, 'artist':2});
                                        clientSocketQueue[2].emit('coopObserve', {'word': picWords[i], 'clean': 0, 'artist':2});
                                       } else if(i== 1 || i == 4 || i == 7) {
                                        clientSocketQueue[1].emit('coopObserve', {'word': picWords[i], 'clean': 0, 'artist':3});
                                        clientSocketQueue[2].emit('coopDraw', {'word': picWords[i], 'clean': 0, 'artist':3});
                                        clientSocketQueue[0].emit('coopObserve', {'word': picWords[i], 'clean': 0, 'artist':3});
                                       } else if (i== 2 || i == 5 || i == 8) {
                                        clientSocketQueue[2].emit('coopObserve', {'word': picWords[i], 'clean': 0, 'artist':1});
                                        clientSocketQueue[0].emit('coopDraw', {'word': picWords[i], 'clean': 0, 'artist':1});
                                        clientSocketQueue[1].emit('coopObserve', {'word': picWords[i], 'clean': 0, 'artist':1});
                                       }
                                       currTime = moment();
                                       console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                                       }, fixationDur[i] + picBlockDur + fixationDur[i] + zigBlockDur + fixationDur[i] + inspirationBlockDur + fixationDur[i] + picBlockDur + fixationDur[i]);
                            
                            setTimeout(function(){
                                       io.sockets.emit('showFixationAndSaveCoop', {'word': picWords[i], 'cond': 'coop'});
                                       //now = new Date();
                                       console.log('Clients are asked to show fixation and save data at ' + moment().format());
                                       currTime = moment();
                                       console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                                       }, fixationDur[i] + picBlockDur + fixationDur[i] + zigBlockDur + fixationDur[i] + inspirationBlockDur + fixationDur[i] + picBlockDur + fixationDur[i] + picBlockDur);

                            setTimeout(function(){
                                       if(i == 0 || i == 3 || i == 6) {
                                        clientSocketQueue[0].emit('coopObserve', {'word': picWords[i], 'clean': 0, 'artist':3});
                                        clientSocketQueue[1].emit('coopObserve', {'word': picWords[i], 'clean': 0, 'artist':3});
                                        clientSocketQueue[2].emit('coopDraw', {'word': picWords[i], 'clean': 0, 'artist':3});
                                       } else if(i== 1 || i == 4 || i == 7) {
                                        clientSocketQueue[1].emit('coopObserve', {'word': picWords[i], 'clean': 0, 'artist':1});
                                        clientSocketQueue[2].emit('coopObserve', {'word': picWords[i], 'clean': 0, 'artist':1});
                                        clientSocketQueue[0].emit('coopDraw', {'word': picWords[i], 'clean': 0, 'artist':1});
                                       } else if (i== 2 || i == 5 || i == 8) {
                                        clientSocketQueue[2].emit('coopObserve', {'word': picWords[i], 'clean': 0, 'artist':2});
                                        clientSocketQueue[0].emit('coopObserve', {'word': picWords[i], 'clean': 0, 'artist':2});
                                        clientSocketQueue[1].emit('coopDraw', {'word': picWords[i], 'clean': 0, 'artist':2});
                                       }
                                       currTime = moment();
                                       console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                                       }, fixationDur[i] + picBlockDur + fixationDur[i] + zigBlockDur + fixationDur[i] + inspirationBlockDur + fixationDur[i] + picBlockDur + fixationDur[i] + picBlockDur + fixationDur[i]);
                            
                            setTimeout(function(){
                                       io.sockets.emit('showFixationAndSaveCoop', {'word': picWords[i], 'cond': 'coop'});
                                       //now = new Date();
                                       console.log('Clients are asked to show fixation and save data at ' + moment().format());
                                       currTime = moment();
                                       console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                                       }, fixationDur[i] + picBlockDur + fixationDur[i] + zigBlockDur + fixationDur[i] + inspirationBlockDur + fixationDur[i] + picBlockDur + fixationDur[i] + picBlockDur + fixationDur[i] + picBlockDur);
                            
                            setTimeout(function(){
                                       if (i < picWords.length){
                                        console.log('going for the next word');
                                        call("next");
                                       currTime = moment();
                                       console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                                       } else {
                                        io.sockets.emit('endExperiment');
                                        //now = new Date();
                                        console.log('Clients are asked to end experiment at ' + moment().format());
                                       currTime = moment();
                                       console.log('[Time passed] = ' + currTime.diff(startTime, 'seconds') + ' fixationDur = ' + fixationDur[i]);
                                       }
                                       }, fixationDur[i] + picBlockDur + fixationDur[i] + zigBlockDur + fixationDur[i] + inspirationBlockDur + fixationDur[i] + picBlockDur + fixationDur[i] + picBlockDur + fixationDur[i] + picBlockDur + 10);
                            }
                            

                            });
                           }, instructionDur + scannerCountDownDur + 1000);
                
                    //i=1;
                    // wait for 10 s for fixation, stop experiment
//                if (i==10) {
//                    setTimeout(function(){
//                               //client.broadcast.emit('endExperiment');
//                               //client.emit('endExperiment');
//                               io.sockets.emit('endExperiment');
//                               console.log('Clients are asked to end experiment');
//                               }, 10);
//                }
                
                }
                
                               
                });

      // when clients are ready
//      client.on('startExperiment')
      
      
      // when we receive mouse move
      client.on('mouseMoveCoop', function(data){
                client.broadcast.emit('moving', data);
                //console.log('Client number = ' + data.id + 'is drawing the word ' + data.word);
                //console.log('mouseMoveCoop mode: player ' + data.id + ' drawing ' + data.word);
                if(data.drawing == true) {
                    //now = new Date();
                    console.log('mouseMoveCoop mode: player ' + data.id + ' drawing ' + data.word + ' time: ' + moment().format() + ' x = ' + data.x + ' y = ' + data.y);
                }
                });
      
      client.on('clientClosed', function(){
                if(numPlayers > 0){
                  numPlayers -= 1;
                } else {
                  numPlayers = 0;
                }
                
                
                console.log('Number of players left = ' + numPlayers);
                
                });
      // cliend drawing independently, no need to broadcast. Just save the data
      client.on('mouseMoveInd', function(data){
                //var now = new Date();
                //save the data, with timestamps preferably and then make a png out of it
                if(data.drawing == true) {
                    //now = new Date();
                    console.log('mouseMoveInd mode: player ' + data.id + ' drawing ' + data.word + ' time: ' + moment().format() + ' x = ' + data.x + ' y = ' + data.y);
                }
                
                });
      
      client.on('hereIsData', function(data){
                console.log('Client ' + data.id + ' sent picture for word ' + data.word + ' and cond: ' + data.cond);
                var dataString = data.dataURL;
                var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                var filename = imgFolder + '/Image_Client_' + data.id + '_Word_' + data.word + '_Cond_' + data.cond + '.png';
                var filename2 = 'Image_Client_' + data.id + '_Word_' + data.word + '_Cond_' + data.cond + '.png';
                var imagedata = new Buffer(matches[2], 'base64');
                fs.writeFile(filename2, imagedata, function(err) {
                             console.log('Err ' + err);
                             });
                
               fs.writeFile(filename, imagedata, function(err) {
                            console.log('Err ' + err);
                            });
               
               });



});

console.log = function(d) { //
   log_file.write(util.format(d) + '\n');
   log_stdout.write(util.format(d) + '\n');
};

//function sleep(time, callback) {
//    var stop = new Date().getTime();
//    console.log('In Sleep mode');
//    while(new Date().getTime() < stop + time) {
//        ;
//    }
//    callback();
//}

app.get('/', function(req, res){
    //res.setHeader("access-control-allow-origin", "*");
    res.sendFile(__dirname + '/index.html');
});

app.get('/:image', function(req, res){
        var imgName = req.params.image;
        res.setHeader("access-control-allow-origin", "*");
        res.sendFile(__dirname + '/' + imgName);
        
        });

server.listen(8080);

