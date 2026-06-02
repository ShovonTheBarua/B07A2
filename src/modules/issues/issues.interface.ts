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
