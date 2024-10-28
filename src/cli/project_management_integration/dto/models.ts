
export type IssueDTO = {
    internalId: string;
    id: string;
    key: string;
    self: string;
    type: string;
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
  account:string;
  issue: string;
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
  state?:string,
  completeDate?:string,
  createdDate?:string 

  
};

