export type QueryFunction = (
  text: string,
  params?: unknown[]
) => Promise<{
  rows: unknown[];
  rowCount: number | null;
  command: string;
  oid: number;
  fields: unknown[];
}>;
