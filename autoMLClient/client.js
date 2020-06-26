const projectId = "concise-smoke-280412";
const location = "us-central1";
const modelId = "TEN2837621807987556352";

const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;

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

  console.log(response);

  let output = response.payload.map((e) => {
    return {
      label: e.displayName,
      snippet: e.textExtraction.textSegment.content,
    };
  });

  return output;
}

module.exports.predict = predict;
