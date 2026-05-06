
const ORIGIN:string = location.origin
const CACHE_NAME:string = "SW_CACHE";
const Addr:string|URL = 'ws://localhost:8080';


// type SnapShot = {
//         url?:string,
//         size?:number,
//         type_file?:string
// }

enum Protocols {
        read = "read",
        write = "write",
        exec = "exec"
}

function definetype(type:string):string
{
        let a:string = "";
        switch (type){
                case "glb":
                case "cjs":
                case "json":
                case "gltf":
                        a = "application/"+ type;
                break;
                case "png":
                case "jpg":
                        a = "image/"+ type;
                break;
                case "css":
                        a = "stylesheet/"+ type;
                break;
        }
        return a;
}

function formatResponseFromBlob(blob:Blob,type_file:string):Response
{
        let data = blob.slice(0,blob.size,definetype(type_file))
        return new Response(data,{
                headers : {
                        "Content-Type":definetype(type_file)
                }
        })
}


async function fetchingWebSocket():Promise<Map<string,Response>>
{
        let snapshot_payload:SnapShot = {};
        let inMemoryData:Map<string,Response> = new Map();
        let _map_:Map<string,Response> = new Map();
        let proxy = new Proxy(inMemoryData,{
                get:function(target:Map<string,Response>,p:string|symbol, receiver:any)
                {
                        if(p){
                                return _map_.get(p.toString())
                        }
                        return target
                },
                set:function(_target,_p,_newvalue,_receiver){
                        throw new Error("can't set this proxy")
                }
        })  
        let resolvePending:(data:Map<string,Response>)=>void;
        let rejectPending:()=>void;    

        let pending_datafile:Promise<Map<string,Response>> = new Promise((resolve,reject)=>{
                resolvePending = resolve;
                rejectPending = reject;
        })

        Object.defineProperty(proxy,'set', {
                value: function()
                {
                        _map_.set(arguments[0],formatResponseFromBlob(arguments[1],snapshot_payload.type_file as string))
                        },
                        writable: true,
                        configurable: true
        }) 

        const ws = new WebSocket(Addr,[Protocols.write]);

        let payloadBlobToggle = true;


        ws.onopen = () => {
                console.log("web socket active\n");
        };

        ws.onmessage = (message) => {
                switch (true) {
                        case (message.data == "end"):
                                resolvePending(_map_)
                                ws.close()
                        break;
                        case (!payloadBlobToggle):

                                inMemoryData.set(snapshot_payload.url as string,message.data)
                                payloadBlobToggle = !payloadBlobToggle
                        break;
                        case (payloadBlobToggle):
                                console.log(message.data)

                                snapshot_payload = JSON.parse(message.data)
                                payloadBlobToggle = !payloadBlobToggle
                        break;
                        
                }
        };

        ws.onerror = (err) => {
                rejectPending()
        }
        
        return pending_datafile
}

async function cachePutResponse():Promise<void>
{
        const cache:Cache = await caches.open(CACHE_NAME);
        let datas:Map<string,Response> = await fetchingWebSocket();
        datas.forEach((res:Response,url:string)=>{
                cache.put(url as RequestInfo,res);
        });
}

async function putInCache(request:RequestInfo,response:Response):Promise<void>
{
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response);
}


async function searchFile(url:string)
{
        const ws:WebSocket = new WebSocket(Addr,[Protocols.read]);
        let snapshot_payload:SnapShot = {}
        let resolvePending:(res:Response)=>void;
        let rejectPending:()=>void;    
        let pending_datafile:Promise<Response> = new Promise((resolve,reject)=>{
                resolvePending = resolve;
                rejectPending = reject;
        })
        let payloadBlobToggle = true;

        ws.onopen = () => {
                console.log("open")
                ws.send(url)
        }

        let data:Response;

        ws.onmessage = (message) => {
                switch (true) {
                        case(message.data == "end") :
                                if(data){ 
                                        resolvePending(data)
                                } else {
                                        rejectPending()
                                }
                        break;
                        case(payloadBlobToggle):
                                snapshot_payload = JSON.parse(message.data)
                                payloadBlobToggle = !payloadBlobToggle;
                        break;
                        case(!payloadBlobToggle): 
                                data = formatResponseFromBlob(message.data,snapshot_payload.type_file as string)
                                payloadBlobToggle = !payloadBlobToggle;
                        break;
                }
        }
        return pending_datafile;
}

async function response(url:string):Promise<Response>
{
        const cache = await caches.open(CACHE_NAME);
        let data = await cache.match(url);

        if(data){
                console.log("from cache")
                return data;                   
        }

        return searchFile(url.replace(ORIGIN,"..")).then((data)=>{
                console.log("from cloud")
                putInCache(url,data);
                return data;
        }).catch(async ()=>{
                return fetch(url).then((res)=>{
                        if (res.status == 200){
                                putInCache(url,res)
                        }
                        return res
                });
        });  
}

(async ()=>{

        fetchingWebSocket().then((a)=>{console.log(a)}).catch((err)=>{
                console.log(err)
        });
        // cachePutResponse().then(()=>{
        //         console.log("ok")
        // }).catch((err)=>{
        //         console.log("error")
        // });
        // searchFile
        // let b = await response("https://localhost:3000/test/fs/test/scene1/1.Setting/1.RendererSetting.cjs");
        // let b = await response("https://localhost:3000/test/fs/asset/img/marsbump1k.jpg");
        // console.log(b)
})()


// sw.addEventListener('install',(_: ExtendableEvent)=>{
//         sw.skipWaiting();
// })

// sw.addEventListener('activate',(event:ExtendableEvent)=>{
//         console.log("actif")
//         event.waitUntil(
//                 (async () => {
//                         await cachePutResponse();
//                         await sw.clients.claim();
//                 })()
//         );
// })


// sw.addEventListener('fetch',(event: FetchEvent)=>{
//         console.log(event.request)
//         event.respondWith((async ()=>{
//                 return await response(event.request as unknown as string)
//         })())
// })


