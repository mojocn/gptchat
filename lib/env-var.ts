export const OPENAI_API_TYPE = process.env.OPENAI_API_TYPE || "openai"; // auzre
export const OPENAI_API_HOST =
  process.env.OPENAI_API_HOST || "https://api.openai.com";
export const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION || "";
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
export const AZURE_API_HOST =
  process.env.AZURE_API_HOST || "https://zhouqingai.openai.azure.com";
export const AZURE_API_VERSION =
  process.env.AZURE_API_VERSION || "2023-03-15-preview";
export const AZURE_DEPLOYMENT_ID =
  process.env.AZURE_DEPLOYMENT_ID || "gpt-35-turbo";

export const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
