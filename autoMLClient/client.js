const projectId = "concise-smoke-280412";
const location = "us-central1";
const modelId = "TEN2837621807987556352";

const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
// const keyFile = {
//   type: process.env.type,
//   project_id: process.env.project_id,
//   private_key_id: process.env.private_key_id,
//   private_key: process.env.private_key,
//   client_email: process.env.client_email,
//   client_id: process.env.client_id,
//   auth_uri: process.env.auth_uri,
//   token_uri: process.env.token_uri,
//   auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
//   client_x509_cert_url: process.env.client_x509_cert_url,
// };

const { PredictionServiceClient } = require("@google-cloud/automl").v1;

const client = new PredictionServiceClient({
  keyFilename,
});

async function predict(content) {
  const request = {
    name: client.modelPath(projectId, location, modelId),
    payload: {
      textSnippet: {
        content: content,
        mimeType: "text/plain",
      },
    },
  };

  const [response] = await client
    .predict(request)
    .catch((err) => console.log(err));

  // console.log(response);

  let output = response.payload.map((e) => {
    return {
      label: e.displayName,
      snippet: e.textExtraction.textSegment.content,
    };
  });

  return output;
}

module.exports.predict = predict;
