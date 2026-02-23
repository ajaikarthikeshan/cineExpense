export const storageConfig = {
  bucket: process.env.S3_BUCKET ?? 'cineexpense-receipts',
  region: process.env.S3_REGION ?? 'us-east-1',
  endpoint: process.env.S3_ENDPOINT, // for localstack / minio in dev
  signedUrlExpiry: 3600, // 1 hour
};
