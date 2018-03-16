import { Component, ViewChild, OnInit } from '@angular/core';
import {$WebSocket, WebSocketSendMode} from 'angular2-websocket/angular2-websocket';
// import {WebSocketService} from './websocket.service';

const config = {
  wssHost: 'wss://www.shivvideocall.org.in/'
//   wssHost: 'wss://localhost:8080/'
//   wssHost: 'ws://students.iitm.ac.in:443/'
  // wssHost: 'wss://example.com/myWebSocket'
};

const peerConnCfg = {'iceServers': [
    // [{'url': 'stun:74.125.142.127:19302'}, 
    // {'url': 'stun:stun.l.google.com:19302'},
    // {url:'stun:stun01.sipphone.com'},
    // {url:'stun:stun.ekiga.net'},
    // {url:'stun:stun.fwdnet.net'},
    // {url:'stun:stun.ideasip.com'},
    // {url:'stun:stun.iptel.org'},
    // {url:'stun:stun.rixtelecom.se'},
    // {url:'stun:stun.schlund.de'},
    {url:'stun:stun.l.google.com:19302'},
    // {url:'stun:stun1.l.google.com:19302'},
    // {url:'stun:stun2.l.google.com:19302'},
    // {url:'stun:stun3.l.google.com:19302'},
    // {url:'stun:stun4.l.google.com:19302'},
    // {url:'stun:stunserver.org'},
    // {url:'stun:stun.softjoys.com'},
    // {url:'stun:stun.voiparound.com'},
    // {url:'stun:stun.voipbuster.com'},
    // {url:'stun:stun.voipstunt.com'},
    // {url:'stun:stun.voxgratia.org'},
    // {url:'stun:stun.xten.com'},
    // {
    //     url: 'turn:numb.viagenie.ca',
    //     credential: 'muazkh',
    //     username: 'webrtc@live.com'
    // },
    // {
    //     url: 'turn:192.158.29.39:3478?transport=udp',
    //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    //     username: '28224511:1379330808'
    // },
    // {
    //     url: 'turn:192.158.29.39:3478?transport=tcp',
    //     credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
    //     username: '28224511:1379330808'
    // }
  ]
};

var wsc = new $WebSocket(config.wssHost);

var rtcPeerConnection = new RTCPeerConnection(peerConnCfg);

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

    constructor() {
        // rtcPeerConnection = new RTCPeerConnection(this.peerConnCfg);
        wsc.onMessage((evt) => {
            console.log("WSC.OnMessgae Function");
            let signal = null;
            console.log(JSON.parse(evt.data));
            signal = JSON.parse(evt.data);
            if (signal.sdp) {
                console.log("Recieved SDP from peer");
                console.log(signal);
                rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            }
            else if (signal.candidate) {
                console.log("Recieved ICE Candidate from Peer");
                rtcPeerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
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
        console.log(rtcPeerConnection);

        if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia){
            navigator.mediaDevices.getUserMedia({video : true, audio : true})
                                    .then(stream => {
                                        console.log(stream);
                                        this.OwnVideoStream = stream;
                                        ownVideo.src = URL.createObjectURL(stream);
                                        ownVideo.muted = "muted";
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
        //             if (!rtcPeerConnection) {
        //                 this.answerCall();
        //             }
        //             signal = JSON.parse(evt.data);
        //             if (signal.sdp) {
        //                 console.log("Recieved SDP from peer");
        //                 rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        //             }
        //             else if (signal.candidate) {
        //                 console.log("Recieved ICE Candidate from Peer");
        //                 rtcPeerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
        //             }
        //             else if (signal.closeConnection) {
        //                 console.log("Recieved Close Call from Peer");
        //                 this.endCall();
        //             }    
        //         }, err => {
        //             console.log(err);
        //         });

    //     rtcPeerConnection.onaddstream = event => {
    //         alert("A stream (id: '" + event.stream.id + "') has been added to this connection.");
    //         peerVideo.src = URL.createObjectURL(event.stream);
    //         peerVideo.play();
    //     };

    //     rtcPeerConnection.createOffer(offer => {
    //         rtcPeerConnection.setLocalDescription(new RTCSessionDescription(offer))
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

    //     rtcPeerConnection.createAnswer(answer => {
    //         rtcPeerConnection.setLocalDescription(new RTCSessionDescription(answer))
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
        console.log(rtcPeerConnection);
        this.callState = 1;
        // send any ice candidates to the other peer
        rtcPeerConnection.onicecandidate = this.onIceCandidateHandler;
        // Peer Stream Arrived
        rtcPeerConnection.onaddstream = this.streamArrived;
    }

    initiateCall(){
        console.log("Initiate Call Function");
        this.prepareCall();
        rtcPeerConnection.addStream(this.OwnVideoStream);
        console.log(this.OwnVideoStream);
        console.log("Own Video Stream Added!!");
        this.createAndSendOffer();
    }
    
    answerCall(){
        console.log("Answer Call Funtion");
        this.prepareCall();
        rtcPeerConnection.addStream(this.OwnVideoStream);
        console.log(this.OwnVideoStream);
        console.log("Own Video Stream Added!!");
        this.createAndSendAnswer();
    }

    createAndSendOffer(){
        console.log("Create Offer Function");
        rtcPeerConnection.createOffer()
            .then(offer => {
                console.log("Create Offer Function");
                let off = new RTCSessionDescription(offer);
                rtcPeerConnection.setLocalDescription(new RTCSessionDescription(off))
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
        rtcPeerConnection.createAnswer()
            .then(answer => {
                console.log("Create Answer Function");
                let ans = new RTCSessionDescription(answer);
                rtcPeerConnection.setLocalDescription(new RTCSessionDescription(ans))
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
        rtcPeerConnection.close();
        this.PeerVideo.nativeElement.src = "";
    }

}