import { fetchingWebSocket,response, testExec } from "./test.ts";

(async ()=>{
        // fetchingWebSocket().then((a)=>{console.log(a)}).catch((err)=>{
        //         console.log(err)
        // });

        testExec(`
                function add(a,b){
                        return a + b;
                }
                        
                add(3 + 4);
        `);
        // cachePutResponse().then(()=>{
        //         console.log("ok")
        // }).catch((err)=>{
        //         console.log("error")
        // });
        // searchFile
        // let cache_smale = await response("https://localhost:3000/test/fs/test/scene1/1.Setting/1.RendererSetting.cjs");
        // let cache_big = await response("https://localhost:3000/test/fs/asset/img/marsbump1k.jpg");
        // console.log(cache_smale,cache_big)
})()