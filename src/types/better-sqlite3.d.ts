declare module 'better-sqlite3' {
  export interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): void;
    close(): void;
    [key: string]: any;
  }

  export interface Statement {
    run(...params: any[]): RunResult;
    get<T = any>(...params: any[]): T;
    all<T = any>(...params: any[]): T[];
    [key: string]: any;
  }

  export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  export default function BetterSqlite3(filename: string, options?: any): Database;
}

