
export type IssueDTO = {
    internalId: string;
    id: string;
    key: string;
    self: string;
    type: string;
    title?: string;
    description?:string;
    status?:string;
    createdDate?:string;
    completedDate?:string;
    dueDate?:string;
    parentId?:string;
    parentKey?:string;
  };
  
export type IssuesDTO = {
    data: any[];
 };

export type PlannedItemDTO = {
  email:string;
  startDate:string;
  dueDate:string;
  id: string;
}

export type AssigneeDTO = {
  name?:string;
  account:string;
  issue: string;
  issueName?: string;
  startDate?: string;
  dueDate?: string;
  completedDate?:string;
  endDate?: string;
  status?: string;
}

export type personDTO = {
  id:string;
  active : string;
  displayName : string;
  self  : string;  

}


 export type TimeBoxDTO = {
  internalId: string;  
  startDate:string;
  endDate: string;
  name: string;
  id: string;
  self: string;
  state?:string;
  completeDate?:string;
  createdDate?:string;
  tasks:AssigneeDTO[];

  
};
