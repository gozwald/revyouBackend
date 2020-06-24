const automl = require("@google-cloud/automl");
const fs = require("fs");

// Create client for prediction service.
const client = new automl.PredictionServiceClient();

/**
 * TODO(developer): Uncomment the following line before running the sample.
 */
// const projectId = `The GCLOUD_PROJECT string, e.g. "my-gcloud-project"`;
// const computeRegion = `region-name, e.g. "us-central1"`;
// const modelId = `id of the model, e.g. “ICN723541179344731436”`;
// const filePath = `local text file path of content to be classified, e.g. "./resources/flower.png"`;
// const scoreThreshold = `value between 0.0 and 1.0, e.g. "0.5"`;

// Get the full path of the model.
const modelFullId = client.modelPath(projectId, computeRegion, modelId);

// Read the file content for prediction.
const content = fs.readFileSync(filePath, "base64");

const params = {};

if (scoreThreshold) {
  params.score_threshold = scoreThreshold;
}

// Set the payload by giving the content and type of the file.
const payload = {};
payload.image = { imageBytes: content };

// params is additional domain-specific parameters.
// currently there is no additional parameters supported.
const [response] = await client.predict({
  name: modelFullId,
  payload: payload,
  params: params,
});
console.log("Prediction results:");
response.payload.forEach((result) => {
  console.log(`Predicted class name: ${result.displayName}`);
  console.log(`Predicted class score: ${result.classification.score}`);
});
