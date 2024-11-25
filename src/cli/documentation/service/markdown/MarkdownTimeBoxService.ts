import { Model} from "../../../../language/generated/ast.js"
import { createPath} from '../../../generator-utils.js'
import fs from "fs";
import path from "path";
import { LowSync } from 'lowdb';
import { JSONFileSync  } from 'lowdb/node';
import { expandToStringWithNL } from "langium/generate";
import { IssuesDTO, TimeBox} from '../../../model/models.js'
import { CumulativeFlowDiagram } from './chart/sprint/CumulativeFlowDiagram.js';
import { SprintMonteCarlo } from "./chart/sprint/MonteCarlo.js";
import { ProjectDependencyAnalyzer } from "./chart/sprint/ProjectDependencyAnalyzer.js";

export class MarkdownTimeBoxService {

    model: Model
    target_folder:string
    MANAGEMENT_PATH :string
    TIMEBOX_PATH :string
    TIMEBOX_CHARTS_PATH :string
    jsonFile: string
    DB_PATH: string
    
    constructor (model: Model, target_folder:string, db_path:string){
        this.model = model
        this.target_folder = target_folder
        this.MANAGEMENT_PATH = createPath(this.target_folder,'management')
        this.TIMEBOX_PATH = createPath(this.MANAGEMENT_PATH,'sprints')
        this.TIMEBOX_CHARTS_PATH = createPath(this.TIMEBOX_PATH,'charts')
        this.jsonFile = "timebox.json"
        this.DB_PATH = db_path
    }

    public async create(){

        const timeBoxes = await this.retrive(this.jsonFile);



        timeBoxes.forEach (timebox  =>{
            
            fs.writeFileSync(path.join(this.TIMEBOX_PATH, `/${timebox.id}.md`), this.createTimeBoxExport(timebox))
            
            // Gerar o CFD
            const generatorx = new CumulativeFlowDiagram(timebox,this.TIMEBOX_CHARTS_PATH+`/cfd-${timebox.id}.svg`);
            generatorx.generate();   
        } );
                
    }

    private createTimeBoxExport(timeBox: TimeBox ):string {


     // Gerar simulação
      const monteCarlo = new SprintMonteCarlo(timeBox,10000);
      const monteCarloAnalysis = monteCarlo.generateMarkdownReport();

      const analyzer = new ProjectDependencyAnalyzer(timeBox);
      const dependencyAnalysis = analyzer.generateAnalysis();

        return expandToStringWithNL`
        ---
        title: "${timeBox.name.toLocaleUpperCase()}"
        sidebar_position: ${timeBox.id}
        ---
        ## Dados do Sprint
        * **Goal**:  ${timeBox.description}
        * **Data Início**: ${timeBox.startDate}
        * **Data Fim**: ${timeBox.endDate}
        
        ## Sprint Backlog

        |ID |Nome |Resposável |Data de Inicío | Data Planejada | Status|
        |:----    |:----|:--------  |:-------:       | :----------:  | :---: |
        ${timeBox.sprintItems?.map(assignee => `|${assignee.issue.id.toLocaleLowerCase()}|${assignee.issue.title ?? "-"}|${assignee.assignee.name}|${assignee.startDate?? ""}|${assignee.dueDate ?? ""}|${assignee.status?.toLocaleUpperCase()}|`).join("\n")}
      
        ${dependencyAnalysis}
        
       
        ## Cumulative Flow
        ![ Cumulative Flow](./charts/cfd-${timeBox.id}.svg)

        ${monteCarloAnalysis}
        `
    }

    protected async retrive(database: string){
    
        const ISSUEPATH = path.join(this.DB_PATH, database);
        
        const adapter = new JSONFileSync<IssuesDTO>(ISSUEPATH);
        const defaultData: IssuesDTO = { data: [] };

        const db = new LowSync<IssuesDTO>(adapter, defaultData);
        await db.read();
        
        return db.data.data.sort((a, b) => {
            return Number(a.id) - Number(b.id);
        }); 
        
    }  

   

}