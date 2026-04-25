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
    region: env.s3Region,
    credentials: {
        accessKeyId: env.s3AccessKeyId,
        secretAccessKey: env.s3SecretAccessKey,
    },
});

const uploadFile = async (file: MulterFile, key: string) => {
    const command = new PutObjectCommand({
        Bucket: env.s3BucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });
    await s3.send(command);
    return `https://${env.s3BucketName}.s3.${env.s3Region}.amazonaws.com/${key}`;
};

const deleteFile = async (key: string) => {
    const command = new DeleteObjectCommand({
        Bucket: env.s3BucketName,
        Key: key,
    });
    await s3.send(command);
};

export { uploadFile, deleteFile, s3 };