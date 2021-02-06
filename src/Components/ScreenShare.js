import React, { Component } from 'react'
import "../Styles/ScreenShareStyle.css"
import SignalRUtil from '../Utils/SignalRUtil'
import Peer from 'peerjs';

export default class ScreenShare extends Component {

    constructor(params){
        super(params)
        this.state = {
            ConnectionId : "",
            PeerId:[],
            SelectedValue : "",
            GoingCall : [],
            VideoElements:[]
        }
        this.peer = new Peer();
        this.videoref = React.createRef()
    }

    componentDidMount(){
        this.SignalR = new SignalRUtil();
        this.SignalR.recieveEvent((data) =>{
            console.log(data)
        })

        //Recieve all the peer ids
        this.SignalR.ReceiveConnectionId( (data) =>{
            console.log(data.peers)
            let temp = []
            data.peers.forEach((x) =>{
                if(x  !== this.state.ConnectionId){
                    temp.push(x) // We leave our peer id , beacause obviously we dont wanna connect to ourself
                }
            })
            this.setState({
                PeerId:temp
            },() =>{
              console.log(this.state.PeerId)  
            } )          
        }  
        )

        this.SignalR.RecieveDisconnectCall( (id,fromPeer) =>{
            if(this.state.ConnectionId === id){
                let videoref = null
                let temparr = []
                this.state.VideoElements.forEach( res =>{
                        if(fromPeer === res.peerid){
                            videoref = res.ElRef
                        }
                        else{
                            temparr.push(res)
                        }
                } )

                //Remove the video
                this.setState({
                    VideoElements : temparr
                })

                if(videoref != null)
                {
                    console.log("recieved disconnect")
                    this.StopVideo(videoref.current)
                }
            }
        } )

        //Get and send the peer id
        this.peer.on('open', (id) =>{
            console.log('My peer ID is: ' + id);
            this.setState({
                ConnectionId:id
            },() =>{
                console.log(this.state.ConnectionId)
                this.SignalR.sendMessage(this.state.ConnectionId)
            } )
        })

        window.addEventListener("unload",(event) =>{
            this.SignalR.sendDisconnect(this.state.ConnectionId) 
            
            // Send the disconnet when current window , tab is closed
        } )

        this.peer.on('close' , () =>{
            console.log("closing")
            this.setState({
                ConnectionId:""
            })
            this.SignalR.sendDisconnect(this.state.ConnectionId)
        } )

        this.peer.on('call', (call) => {
            // Answer the call, only one way is established

            // Will be used to Add video
            let callObj ={
                peerid : call.peer,
                ElRef : React.createRef()
            }
            let temp = this.state.VideoElements
            temp.push(callObj)
            this.setState({
                VideoElements : temp 
            },  () => console.log(this.state.VideoElements) )

            console.log("calling")
            call.answer();
            console.log("Answered")

            // Do when the call looses
            call.on('close', () =>{
                console.log("closing recieved")
                this.StopVideo(callObj.ElRef.current)
            })

            call.on('stream', (stream) => {
                console.log("streaming")
                // `stream` is the MediaStream of the remote peer.
                // Here you'd add it to an HTML video/canvas element.
                this.ShowVideo(callObj.ElRef.current , stream)
              });
          });

    }

    StartCapture = event =>{
        console.log(this.videoref.current)
        this.CaptureScreen();
    }

    ShowVideo = (ElementRef,Stream) =>{
        ElementRef.srcObject = Stream;
        ElementRef.play();
    }

    StopVideo = (ElementRef) =>{
        let tracks =  ElementRef.srcObject.getTracks();
        tracks.forEach(el =>{
            el.stop();
        })
        ElementRef.srcObject = null ;
    }

    stopCapture = event =>{
        let tracks = this.videoref.current.srcObject.getTracks();
        if(this.videoref.current.srcObject !== null)
        {
            tracks.forEach(element => {
                element.stop()
            });
            this.videoref.current.srcObject = null;
        }
    }
    
    CaptureScreen = async function capture() {
        try{
            if(this.state.PeerId.length > 0)
            {
                let temp= await navigator.mediaDevices.getDisplayMedia({
                    video:{
                        cursor:"always"
                    },
                })
                //this.videoref.current.srcObject = temp
                var call = this.peer.call(this.state.SelectedValue,temp)
                let tempArr = this.state.GoingCall
                tempArr.push(this.state.SelectedValue)
                this.setState({
                    GoingCall : tempArr
                })
            }      
        }
        catch(err){
            console.log(err);
        }
    }


    SelectOnChange = (event) =>{
        this.setState({
            SelectedValue:event.target.value
        },() => console.log(this.state.SelectedValue))
    }

    stopStream = (event) =>{
        let temp = []
        this.state.GoingCall.forEach( x=>{
            if(x === this.state.SelectedValue)
            {
                this.SignalR.DisconnectCall(x,this.state.ConnectionId)
            }
            else{
                temp.push(x)
            }
        } )
        this.setState({
            GoingCall : temp
        },() => {console.log(this.state.GoingCall)})

        
    }

    render() {
        let SelectOptionMap = this.state.PeerId.map( (val) =>
           
            <option key={val} value={val}>{val}</option>
         )
         let vid = this.state.VideoElements.map( val =>
             <video className="CaptureElement" key={val.peerid} ref={val.ElRef} ></video>
          )
         SelectOptionMap.push( <option key="XD124" value={this.state.ConnectionId}>Select Client</option>)
        return (
            <div className="container-fluid" >
                <button onClick={this.StartCapture}>Start Casting</button>
                <button onClick={this.stopCapture}>Stop Casting</button>
                <button onClick={this.stopStream}>Stop Streaming</button>
                <select onChange={this.SelectOnChange}>
                    {SelectOptionMap}
                </select>
                <div>
                    {vid}
                </div>
            </div>
        )
    }
}
