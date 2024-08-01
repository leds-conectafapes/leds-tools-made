import type { Model } from '../language/generated/ast.js';
import * as path from 'node:path';
import { GenerateOptions } from './main.js';
import { generateDocumentation} from './Documentation/generate.js'
import { generateProjectManagement} from './Project Manager Integration/generate.js'
import * as vscode from 'vscode';

export async function generate(model: Model, filePath: string, destination: string | undefined, opts: GenerateOptions): Promise<string> {
    const final_destination = extractDestination(filePath, destination)
    
    if (opts.only_project_management){
        const name = await generateProjectManagement(model, final_destination)
        console.log(`Synchronized ${name}`)
    }
    if (opts.only_project_documentation){
        generateDocumentation(model,final_destination)
    }
    if (opts.all){

    }
    
    vscode.window.showInformationMessage("We MADE!")
    return final_destination;
}

function extractDestination(filePath: string, destination?: string) : string {
    const path_ext = new RegExp(path.extname(filePath)+'$', 'g')
    filePath = filePath.replace(path_ext, '')
  
    return destination ?? path.join(path.dirname(filePath))
  }