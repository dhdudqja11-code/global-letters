import * as admin from 'firebase-admin';
import fs from 'fs';
import os from 'os';
import path from 'path';

let db: any;
let isMockDb = false;

try {
  const projectId = (process.env.GCLOUD_PROJECT || 'ask-one-s-heart').trim();
  process.env.GCLOUD_PROJECT = projectId;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const tmpDir = process.env.VERCEL ? '/tmp' : os.tmpdir();
    const adcPath = path.join(tmpDir, 'gcp_adc_credentials.json');
    fs.writeFileSync(adcPath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON.trim(), { encoding: 'utf8', mode: 0o600 });
    process.env.GOOGLE_APPLICATION_CREDENTIALS = adcPath;
  } else if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const localFirebaseAdc = path.join(
      process.env.APPDATA || '',
      'firebase',
      'dhdudqja11_gmail_com_application_default_credentials.json'
    );
    if (localFirebaseAdc && fs.existsSync(localFirebaseAdc)) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = localFirebaseAdc;
    }
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_CONFIG) {
    throw new Error('Missing Google Cloud environment project credentials.');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
  }
  db = admin.firestore();
} catch (error) {
  console.warn('⚠️ Firebase Admin failed to initialize. Activating local JSON database fallback:', error);
  isMockDb = true;

  const getLocalPath = (filename: string) => {
    const baseDir = process.env.VERCEL ? path.join('/tmp', 'backend') : path.join(process.cwd(), '..', 'backend');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    return path.join(baseDir, filename);
  };

  db = {
    collection: (colName: string) => {
      const filePath = getLocalPath(`${colName}.json`);

      const readData = () => {
        if (!fs.existsSync(filePath)) return [];
        try {
          return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch {
          return [];
        }
      };

      const writeData = (data: any) => {
        try {
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (e) {
          console.error('Local DB write error:', e);
        }
      };

      return {
        doc: (docId: string) => {
          return {
            get: async () => {
              const data = readData();
              const found = data.find((item: any) => item.id === docId);
              return {
                exists: !!found,
                data: () => (found ? found.data : null),
              };
            },
            set: async (docData: any) => {
              const data = readData();
              const idx = data.findIndex((item: any) => item.id === docId);
              if (idx > -1) {
                data[idx].data = docData;
              } else {
                data.push({ id: docId, data: docData });
              }
              writeData(data);
              return { success: true };
            },
            update: async (docData: any) => {
              const data = readData();
              const idx = data.findIndex((item: any) => item.id === docId);
              if (idx > -1) {
                data[idx].data = { ...data[idx].data, ...docData };
              } else {
                data.push({ id: docId, data: docData });
              }
              writeData(data);
              return { success: true };
            },
            delete: async () => {
              const data = readData().filter((item: any) => item.id !== docId);
              writeData(data);
              return { success: true };
            },
          };
        },
        add: async (docData: any) => {
          const data = readData();
          const newDoc = { id: Math.random().toString(36).substr(2, 9), data: docData };
          data.push(newDoc);
          writeData(data);
          return { id: newDoc.id };
        },
      };
    },
    runTransaction: async (updateFunction: (transaction: any) => Promise<any>) => {
      const transactionMock = {
        get: async (docRef: any) => {
          return await docRef.get();
        },
        set: async (docRef: any, data: any) => {
          return await docRef.set(data);
        },
        update: async (docRef: any, data: any) => {
          return await docRef.update(data);
        },
      };
      return await updateFunction(transactionMock);
    },
  };
}

export { db, isMockDb };
