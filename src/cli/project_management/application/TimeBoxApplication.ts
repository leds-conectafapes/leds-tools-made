
import { isTimeBox, Model} from "../../../language/generated/ast.js";
import { AbstractApplication } from "./AbstractApplication.js";

import {SprintItem, TimeBox, Person} from "../../model/models.js"

export class TimeBoxApplication extends AbstractApplication {
    
    constructor(target_folder:string, model: Model) {

        super(target_folder, model)       
        this.jsonFile = "timebox.json"
    }

    
    

    public async create() {
        
       const sprints = this.model.components.filter(isTimeBox)

       sprints.map (sprint => {

        const instance: TimeBox = {
            id: sprint.id,
            name: sprint.name?? "",
            description: sprint.description ?? "",
            startDate: sprint.startDate ?? "",
            endDate: sprint.endDate ?? "",
            sprintItems: sprint.sprintBacklog?.planningItems.map(item => ({
                                
                id: item.backlogItem.$refNode?.text.toLocaleLowerCase(),                
                assignee: {
                    id: item.assignee?.ref?.id,  
                    name: item.assignee?.ref?.name,
                    email: item.assignee?.ref?.email
                } as Person,

                issue: {
                    
                    id: item.backlogItem.$refNode?.text.toLocaleLowerCase() ?? "",
                    title: item.backlogItem.ref?.name ?? "" ,
                    description: item.backlogItem.ref?.description ?? "",
                    type: item.backlogItem.ref?.$type.toLocaleLowerCase() ?? "",                    

                    depends: [{id:"Spike.epic1.story1.estudar"}]
                },

                startDate: item.startDate,
                dueDate: item.duedate,
                completedDate:item.completedDate,
                status:item.status ?? "TODO"

            }) as unknown as SprintItem) ?? []

        }
        this.saveorUpdate(instance)
       })
           
    }


    
           
}

