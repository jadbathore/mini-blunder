import ts, { SourceFile } from "typescript";
import express from "express"

export type request = express.Request<{},any,any,any>;
export type response = express.Response<any, Record<string, any>>;



function transformToModulable(path:string): string
{ 
  let match = path.match(/((?<=public))(\/([A-z]|[0-9]|\-|\_)+)+(?=\.(j|t)s)/g);
  if (match) {
    return match[0]
  }
  let match2 = path.match(/(\/([A-z]|[0-9]|\-|\_)+)+(?=\.(j|t)s)/g);
  if (match2) {
    return match2[0]
  }
  return path;
}

export type SourceResolution = {
  source: SourceFile
  resolution: string
};


export class Transpiler
{
    private static _instance:Transpiler;
    private _transpilerMap:Map<string,SourceResolution>;


    private constructor (){
      const tsconfig = ts.readConfigFile("./tsconfig.json", ts.sys.readFile);
      const options = ts.parseJsonConfigFileContent(tsconfig.config, ts.sys, "./");
      const outputs: Map<string,SourceResolution> = new Map();
      const host = ts.createCompilerHost(options.options);
      const program:ts.Program = ts.createProgram(options.fileNames,options.options,host);
      host.writeFile = (name:string, content:string) => {
        if (name.includes('js')) {
          let basename:string = transformToModulable(name);
          console.log(basename)
          outputs.set(basename,{
            resolution: content,
            source: program.getSourceFile(name.replace(/(?<=(\/([A-z]|[0-9]|\-|\_)+)+)(\.js)(?!.)/g,".ts")) as SourceFile
          });
        }
      };
      program.emit();
      this._transpilerMap = outputs;
    }

    public static getInstance():Transpiler
    {
        if (!Transpiler._instance) {
            Transpiler._instance = new Transpiler();
        }
        return Transpiler._instance
    } 
    
    public async handler(req:request,res:response) {
      let file:SourceResolution = Transpiler._instance.get_source_map(req.path);
      res.type("application/javascript").send(file.resolution)
    }

    private get_source_map(key:string)
    {
      return this._transpilerMap.get(transformToModulable(key)) as SourceResolution;
    }
}



// export function inMemoriesTranspiler():Map<string,SourceResolution>
// {
//   const tsconfig = ts.readConfigFile("./tsconfig.json", ts.sys.readFile);
//   const options = ts.parseJsonConfigFileContent(tsconfig.config, ts.sys, "./");
//   const outputs: Map<string,SourceResolution> = new Map();
//   const host = ts.createCompilerHost(options.options);

//   // host.getSourceFile = (name:string,lang:ts.ScriptTarget) => {
//   //   if(!)

//   //   if (name.includes(options.options?.rootDir as string)) {
//   //     let content = ts.sys.readFile(name);
//   //     if (!content) {
//   //       return undefined;
//   //     } else {
//   //       return ts.createSourceFile(name,content,lang);
//   //     }
//   //   }
//   //   return undefined ;
//   // }

//   const program:ts.Program = ts.createProgram(options.fileNames,options.options,host);
//   host.writeFile = (name:string, content:string) => {
//     if (name.includes('js')) {
//       let basename:string = moduleTranscription(name);
//       outputs.set("/" + basename + ".js",{
//         resolution: content,
//         source: program.getSourceFile(name.replace(".js",".ts")) as SourceFile
//       });
//     }
//   };
//   program.emit();
//   return outputs;
// };
//   // console.log(program.getSourceFiles().externalModuleIndicator);
//   // program.emit();

//   // return outputs;

//   // console.log(outputs);
//   // // Get the type analysis results
//   // for (const diagnostic of program.getSemanticDiagnostics()) {
//   //   console.log(diagnostic.file?.fileName);
//   // }
//   // for (const a of (program.getSourceFiles())) {
//   //   console.log(a.getFullWid)
//   // }
//   // // console.log(program.getSourceFiles())
// // }