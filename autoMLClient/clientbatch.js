const projectId = "concise-smoke-280412";
const location = "us-central1";
const modelId = "TEN2837621807987556352";
const inputUri = "gs://amazonbucket_us/testernew.jsonl";
const outputUri = "gs://amazonbucket_us/testerresults.jsonl/";
const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;

const { PredictionServiceClient } = require("@google-cloud/automl").v1;

// Imports the Google Cloud AutoML library
const client = new PredictionServiceClient({
  keyFilename,
});

async function batchPredict() {
  // Construct request
  const request = {
    name: client.modelPath(projectId, location, modelId),
    inputConfig: {
      gcsSource: {
        inputUris: [inputUri],
      },
    },
    outputConfig: {
      gcsDestination: {
        outputUriPrefix: outputUri,
      },
    },
  };

  const [operation] = await client.batchPredict(request);

  console.log("Waiting for operation to complete...");
  // Wait for operation to complete.
  const [response] = await operation.promise();
  console.log(
    `Batch Prediction results saved to Cloud Storage bucket. ${response}`
  );
}

batchPredict();

module.exports.batchPredict = batchPredict;
