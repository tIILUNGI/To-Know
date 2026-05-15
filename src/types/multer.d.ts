declare module 'multer' {
  export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }

  export interface MulterInstance {
    single(fieldname: string): any;
    array(fieldname: string, maxCount?: number): any;
    fields(fields: { name: string; maxCount?: number }[]): any;
    none(): any;
    any(): any;
  }

  export interface DiskStorageOptions {
    destination?: string | ((req, file, cb) => void);
    filename?: string | ((req, file, cb) => void);
  }

  export interface DiskStorage {
    new (options: DiskStorageOptions): DiskStorage;
  }

  const multer: MulterInstance;
  export default multer;
}

