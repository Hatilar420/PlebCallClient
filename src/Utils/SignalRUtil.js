import {HubConnectionBuilder,LogLevel} from '@microsoft/signalr'

class SignalRUtil{

        constructor(){
            
             this.connection = new HubConnectionBuilder()
            .withUrl("http://localhost:5000/hub")
            .configureLogging(LogLevel.Information)
            .withAutomaticReconnect()
            .build();

          this.connection.start().catch(
              err =>{
                  console.log(err);
              }
          );
        
        }


        recieveEvent = (callback) =>{
            this.connection.on("Connected",(message) =>{
                console.log(message);
                callback(message);
            })
        }

        sendMessage = (id) =>{
            this.connection.invoke("sendConnectionId",id).catch((data) => {
                console.log(data)
            })
        }

        sendDisconnect = (id) =>{
            this.connection.invoke("DisconnectPeer",id).catch( (data) =>{
                console.log(data)
            } )
        }

        ReceiveConnectionId = (callback) =>{
            this.connection.on("ReceiveId", res =>{
                console.log(res)
                callback(res);
            })
            this.connection.on("DeletePeerId", res =>{
                console.log(res)
                callback(res)
            })
        }

        DisconnectCall = (id,peer) =>{
            this.connection.invoke("DisconnectCall",id,peer)
        }

        RecieveDisconnectCall = (callback) =>{
               this.connection.on("DisconnectedCall", (id,peerid) =>{
                   console.log(id)
                   callback(id,peerid)
               }) 
        }

        


}

export default SignalRUtil;