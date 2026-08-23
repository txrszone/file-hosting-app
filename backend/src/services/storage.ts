import AWS from 'aws-sdk';
import { Readable } from 'stream';

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_S3_ENDPOINT,
  s3ForcePathStyle: true,
});

const bucket = process.env.AWS_S3_BUCKET || 'filehost';

export const uploadFile = async (
  key: string,
  body: Buffer | Readable,
  mimeType: string
): Promise<string> => {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: mimeType,
    ACL: 'private',
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location || key;
  } catch (error) {
    console.error('S3 upload failed:', error);
    throw error;
  }
};

export const getSignedUrl = (key: string, expiresIn: number = 3600): string => {
  try {
    return s3.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: key,
      Expires: expiresIn,
    });
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    throw error;
  }
};

export const deleteFile = async (key: string): Promise<void> => {
  try {
    await s3.deleteObject({
      Bucket: bucket,
      Key: key,
    }).promise();
  } catch (error) {
    console.error('S3 delete failed:', error);
    throw error;
  }
};

export const fileExists = async (key: string): Promise<boolean> => {
  try {
    await s3.headObject({
      Bucket: bucket,
      Key: key,
    }).promise();
    return true;
  } catch (error: any) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
};

export const getFileStream = async (key: string): Promise<Readable> => {
  return s3.getObject({
    Bucket: bucket,
    Key: key,
  }).createReadStream();
};
