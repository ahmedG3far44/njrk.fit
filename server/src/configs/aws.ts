import { env } from './env';
import {
    DeleteObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';

export interface MulterFile {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
    size: number;
}

const s3 = new S3Client({
    region: env.S3_REGION,
    credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
});

const uploadFile = async (file: MulterFile, key: string) => {
    const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });
    await s3.send(command);
    return `https://${env.S3_BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
};

const deleteFile = async (key: string) => {
    const command = new DeleteObjectCommand({
        Bucket: env.S3_BUCKET_NAME,
        Key: key,
    });
    await s3.send(command);
};

export { uploadFile, deleteFile, s3 };