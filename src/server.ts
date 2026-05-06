import express,{Express} from "express"
import fs from "node:fs"
import dotenv from "dotenv"
import path from "node:path"
import ts from "typescript"
import {type response,type request,type SourceResolution, Transpiler} from "./typescriptTranspiler.js"


let instanceTranspiler = Transpiler.getInstance();

dotenv.config({quiet:true});

const app:Express = express();
let address:Port = ( Number(process.env.ADDR)|| 6343 ) as Port;
let staticPath:string = path.join("src","public");
app.enable('etag');
app.set("view engine","ejs");
app.set("views",path.join(process.cwd(),"views"));


app.get(/(.+).ts/,instanceTranspiler.handler)

app.use(express.static(staticPath,{extensions:["ts"]})); 

app.get("/",async (_:request,res:response)=>{
    res.render('index',{title:"test tcp"})
});

app.listen(address,()=> {
    const url = `http://localhost:${address}/`;
    console.log((`Server running on:\u001B]8;;${url}\u0007${address}\u001B]8;;\u0007`));
});



