import { Component, ViewChild, OnInit } from '@angular/core';
import {$WebSocket, WebSocketSendMode} from 'angular2-websocket/angular2-websocket';
// import {WebSocketService} from './websocket.service';

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

config = {
//   wssHost: 'ws://10.22.21.182:8000/'
  wssHost: 'ws://localhost:8080/'
  // wssHost: 'wss://example.com/myWebSocket'
};

wsc = new $WebSocket(this.config.wssHost);

// peerConn = null;
peerConnCfg = {'iceServers': 
    [{'url': 'stun:stun.services.mozilla.com'}, 
     {'url': 'stun:stun.l.google.com:19302'}]
  };

rtcPeerConnection : RTCPeerConnection = null;

    constructor() {
        this.rtcPeerConnection = new RTCPeerConnection(this.peerConnCfg);
        this.wsc.onMessage((evt) => {
            let signal = null;
            console.log(JSON.parse(evt.data));
            if (this.callState == 0) {
                this.answerCall();
            }
            signal = JSON.parse(evt.data);
            if (signal.sdp) {
                console.log("Recieved SDP from peer");
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
        });
        this.wsc.setSend4Mode(WebSocketSendMode.Direct);
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
        console.log(this.rtcPeerConnection);
        this.callState = 1;
        // send any ice candidates to the other peer
        this.rtcPeerConnection.onicecandidate = this.onIceCandidateHandler;
        // Peer Stream Arrived
        this.rtcPeerConnection.onaddstream = this.streamArrived;
    }

    initiateCall(){
        this.prepareCall();
        this.rtcPeerConnection.addStream(this.OwnVideoStream);
        this.createAndSendOffer();
    }
    
    answerCall(){
        this.prepareCall();
        this.rtcPeerConnection.addStream(this.OwnVideoStream);
        this.createAndSendAnswer();
    }

    createAndSendOffer(){
        // console.log("Create Offer Function");
        this.rtcPeerConnection.createOffer()
            .then(offer => {
                console.log("Create Offer Function");
                let off = new RTCSessionDescription(offer);
                this.rtcPeerConnection.setLocalDescription(new RTCSessionDescription(off))
                        .then(() => {
                            // console.log(JSON.stringify({"sdp" : off}));
                            this.wsc.send(JSON.stringify({"sdp" : off}));
                        }).catch((err) => {
                            console.log(err);
                });
            })
    }

    createAndSendAnswer(){
        this.rtcPeerConnection.createAnswer()
            .then(answer => {
            let ans = new RTCSessionDescription(answer);
            this.rtcPeerConnection.setLocalDescription(new RTCSessionDescription(ans))
                                    .then(() => {
                                        this.wsc.send(JSON.stringify({"sdp" : ans}));
                                    }).catch((err) => {
                                        console.log(err);
                                    });
            }).catch((err) => {
                    console.log(err);
        });
    }

    onIceCandidateHandler(evt){
        if(!evt || !evt.candidate)
            return;
        this.wsc.send(JSON.stringify({"candidate" : evt.candidate}));
        console.log("IceCandidateHandler Function Completed");
    }

    streamArrived(evt){
        console.log("Stream Arrived: " + evt);
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