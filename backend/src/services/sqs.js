import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({ region: process.env.AWS_REGION });

export const enqueueJob = (jobId) =>
  sqs.send(new SendMessageCommand({
    QueueUrl:    process.env.SQS_QUEUE_URL,
    MessageBody: JSON.stringify({ jobId }),
  }));