import { Component, ViewChild, OnInit } from '@angular/core';
import {$WebSocket, WebSocketSendMode} from 'angular2-websocket/angular2-websocket';
// import {WebSocketService} from './websocket.service';

const config = {
  wssHost: 'ws://10.22.21.182:8080/'
//   wssHost: 'ws://localhost:8080/'
//   wssHost: 'ws://students.iitm.ac.in:443/'
  // wssHost: 'wss://example.com/myWebSocket'
};

var wsc = new $WebSocket(config.wssHost);

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

@ViewChild('ownvideo')OwnVideo;
@ViewChild('peervideo')PeerVideo;

OwnVideoStream;
PeerVideoStream;

peerVideo;
callState = 0;

// peerConn = null;
peerConnCfg = {'iceServers': 
    [{'url': 'stun:stun.services.mozilla.com'}, 
     {'url': 'stun:stun.l.google.com:19302'}]
  };

rtcPeerConnection : RTCPeerConnection = null;

    constructor() {
        this.rtcPeerConnection = new RTCPeerConnection(this.peerConnCfg);
        wsc.onMessage((evt) => {
            console.log("WSC.OnMessgae Function");
            let signal = null;
            console.log(JSON.parse(evt.data));
            signal = JSON.parse(evt.data);
            if (signal.sdp) {
                console.log("Recieved SDP from peer");
                console.log(signal);
                this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            }
            else if (signal.candidate) {
                console.log("Recieved ICE Candidate from Peer");
                this.rtcPeerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
            else if (signal.closeConnection) {
                console.log("Recieved Close Call from Peer");
                this.endCall();
            }
            if (this.callState == 0) {
                this.answerCall();
            }
        });
        wsc.setSend4Mode(WebSocketSendMode.Direct);
    }

    ngOnInit(){
        let ownVideo = this.OwnVideo.nativeElement;
        this.peerVideo = this.PeerVideo.nativeElement;
        console.log(this.peerVideo);

        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
            navigator.mediaDevices.getUserMedia({video : true, audio : true})
                                    .then(stream => {
                                        console.log(stream);
                                        this.OwnVideoStream = stream;
                                        ownVideo.src = URL.createObjectURL(stream);
                                        ownVideo.play();
                                    })
                                    .catch(err => {
                                        console.log("Following Error has Occured: " + err.name);
                                    });
        };

        // this.webSocketService.connect(this.config.wssHost)
        //         .map((res: MessageEvent) => {
        //             let data = JSON.parse(res.data);
        //             return 
        //         })
        //         .subscribe((evt) => {
        //             let signal = null;
        //             if (!this.rtcPeerConnection) {
        //                 this.answerCall();
        //             }
        //             signal = JSON.parse(evt.data);
        //             if (signal.sdp) {
        //                 console.log("Recieved SDP from peer");
        //                 this.rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        //             }
        //             else if (signal.candidate) {
        //                 console.log("Recieved ICE Candidate from Peer");
        //                 this.rtcPeerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        //             }
        //             else if (signal.closeConnection) {
        //                 console.log("Recieved Close Call from Peer");
        //                 this.endCall();
        //             }    
        //         }, err => {
        //             console.log(err);
        //         });

    //     this.rtcPeerConnection.onaddstream = event => {
    //         alert("A stream (id: '" + event.stream.id + "') has been added to this connection.");
    //         peerVideo.src = URL.createObjectURL(event.stream);
    //         peerVideo.play();
    //     };

    //     this.rtcPeerConnection.createOffer(offer => {
    //         this.rtcPeerConnection.setLocalDescription(new RTCSessionDescription(offer))
    //                                 .then(() => {
    //                                     console.log('send the offer to a server to be forwarded to the other peer');
    //                                 })
    //                                 .catch(err => {
    //                                     console.log(err);
    //                                 });
    //     }).then(() => {
    //         console.log('Created Offer Successfully');
    //     }).catch(err => {
    //         console.log('Could not create offer, Error: ' + err);
    //     });

    //     this.rtcPeerConnection.createAnswer(answer => {
    //         this.rtcPeerConnection.setLocalDescription(new RTCSessionDescription(answer))
    //                                 .then(() => {
    //                                     console.log('send the answer to a server to be forwarded back to the caller');
    //                                 })
    //                                 .catch(err => {
    //                                     console.log(err);
    //                                 });
    //     }).then(() => {
    //         console.log('Created Answer Successfully');
    //     }).catch(err => {
    //         console.log('Could not create answer, Error: ' + err);
    //     });
    }

    prepareCall(){
        console.log("Prepare Call Function");
        console.log(this.rtcPeerConnection);
        this.callState = 1;
        // send any ice candidates to the other peer
        this.rtcPeerConnection.onicecandidate = this.onIceCandidateHandler;
        // Peer Stream Arrived
        this.rtcPeerConnection.onaddstream = this.streamArrived;
    }

    initiateCall(){
        console.log("Initiate Call Function");
        this.prepareCall();
        this.rtcPeerConnection.addStream(this.OwnVideoStream);
        console.log(this.OwnVideoStream);
        console.log("Own Video Stream Added!!");
        this.createAndSendOffer();
    }
    
    answerCall(){
        console.log("Answer Call Funtion");
        this.prepareCall();
        this.rtcPeerConnection.addStream(this.OwnVideoStream);
        console.log(this.OwnVideoStream);
        console.log("Own Video Stream Added!!");
        this.createAndSendAnswer();
    }

    createAndSendOffer(){
        console.log("Create Offer Function");
        this.rtcPeerConnection.createOffer()
            .then(offer => {
                console.log("Create Offer Function");
                let off = new RTCSessionDescription(offer);
                this.rtcPeerConnection.setLocalDescription(new RTCSessionDescription(off))
                        .then(() => {
                            console.log("set Offer Local Description!!");
                            console.log(JSON.stringify({"sdp" : off}));
                            wsc.send(JSON.stringify({"sdp" : off}));
                        }).catch((err) => {
                            console.log(err);
                });
            }).catch(err => {
                console.log(err);
            });
    }

    createAndSendAnswer(){
        this.rtcPeerConnection.createAnswer()
            .then(answer => {
                console.log("Create Answer Function");
                let ans = new RTCSessionDescription(answer);
                this.rtcPeerConnection.setLocalDescription(new RTCSessionDescription(ans))
                                        .then(() => {
                                            console.log("set Answer Local Description!!");
                                            console.log(JSON.stringify({"sdp" : ans}));
                                            wsc.send(JSON.stringify({"sdp" : ans}));
                                        }).catch((err) => {
                                            console.log(err);
                                        });
                }).catch((err) => {
                        console.log(err);
            });
    }

    onIceCandidateHandler(evt){
        console.log("OnIceCandidatehandler Function");
        console.log(evt);
        console.log(wsc);
        if(!evt || !evt.candidate)
            return;
        console.log(JSON.stringify({"candidate" : evt.candidate}));
        wsc.send(JSON.stringify({"candidate" : evt.candidate}));
        console.log("IceCandidateHandler Function Completed");
    }

    streamArrived(evt){
        console.log("streamArrived Function");
        console.log(evt);
        document.getElementById('peervideo').src = URL.createObjectURL(evt.stream);
        document.getElementById('peervideo').play();
        console.log(document.getElementById('peervideo'));
    }

    endCall(){
        this.rtcPeerConnection.close();
        this.rtcPeerConnection = null;
        this.PeerVideo.nativeElement.src = "";
    }

}