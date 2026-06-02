export interface IIssue {
  title: string;
  description: string;
  type: string;
  status: string;
}

export interface IIssueQuery {
  type?: string;
  status?: string;
  sort?: string;
}

export interface IReporter {
  id: number,
  name: string,
  role: string
}

export interface IUpdateIssue{
    userId: number,
    issueId: number,
    userRole: string,
    title?: string,
    description?: string,
    type?: string,
}