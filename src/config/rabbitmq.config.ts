export const rabbitConfig = {
  uri: process.env.RABBITMQ_URI,
  queueUserIngest: 'user.ingest',
  queueCampaignSend: 'campaign.send',
};