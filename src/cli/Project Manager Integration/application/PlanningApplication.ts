import { IssueAbstractApplication } from "./IssueAbstractApplication.js";
import { TimeBox } from "../../../language/generated/ast.js";
import { AssigneeDAO } from "../dao/AssigneeDAO.js";
import { JsonFileCRUD } from "../dao/JsonFileCRUD.js";
import { IssueDAO } from "../dao/IssueDAO.js";

export class PlanningApplication extends IssueAbstractApplication {
    issueDAO: JsonFileCRUD;

    constructor(email: string, apiToken: string, host: string, projectKey: string, target_folder: string) {
        super(email, apiToken, host, projectKey, target_folder);

        this.objectMap = new Map<string, string>();
        this.jsonDAO = new AssigneeDAO(this.DB_PATH);
        this.issueDAO = new IssueDAO(this.DB_PATH);
    }

    public async processUser() {
        try {
            const result = await this.jiraIntegrationService.getUsers();
            if (Array.isArray(result)) {
                result.forEach((item: any) => {
                    if (item.emailAddress) {
                        this.objectMap.set(item.emailAddress.toLowerCase(), item.accountId);
                    }
                });
            }
        } catch (error) {
            console.error('Error processing users:', error);
        }
    }

    private async _create(email: string, key: string) {
        if (email && key) {
            const accountId = this.objectMap.get(email.toLowerCase());
            const id = `${key.toLowerCase()}.${accountId?.toLowerCase()}`;
            console.log(id);
            if (!this.idExists(id, this.jsonDAO)) {
                try {
                    let result = await this.jiraIntegrationService.assigneTeamMemberIssue(key, accountId ?? "");
                    result += "a"
                    const value = {
                        issueId: key,
                        accountId: accountId
                    };
                    await this.save(id, value);
                } catch (error) {
                    console.error('Error assigning team member to issue:', error);
                }
            }
        }
    }

    public async createPlanning(timeBox: TimeBox) {
        const planningItems = timeBox?.planning?.planningItems ?? [];
        for (const planningItem of planningItems) {
            const email = planningItem?.assigner?.ref?.email;
            const itemId = planningItem?.item?.ref?.id.toLowerCase() ?? planningItem?.itemString?.toLowerCase();
            if (!itemId) continue;

            const issues = [];
            const response = this.issueDAO.readbyPartOfKey(itemId);
            for (const value of response) {
                const data = response[value];
                const type = data?.type;
                if (type !== "epic") {
                    const key = data?.key;
                    if (key) {
                        issues.push(key);
                    }
                }
            }

            for (const issueId of issues) {
                await this._create(email ?? "", issueId);
            }
        }
    }

    private async save(id: any, result: any) {
        await super.saveOnFile(id, result, this.jsonDAO, "assignees");
    }
}
