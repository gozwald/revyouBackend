/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
const projectId = 'concise-smoke-280412';
const location = 'us-central1';
const modelId = 'TEN2837621807987556352';
const content = 'This is a fantastic usb Cable and it works great!'
const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS

// Imports the Google Cloud AutoML library
const {PredictionServiceClient} = require('@google-cloud/automl').v1;

// const myKeyData = require(process.env.GOOGLE_APPLICATION_CREDENTIALS)

// console.log(myKeyData.client_id)

console.log(process.env.GOOGLE_APPLICATION_CREDENTIALS)

// Instantiates a client
const client = new PredictionServiceClient({
  keyFilename
});

async function predict() {
  // Construct request
  const request = {
    name: client.modelPath(projectId, location, modelId),
    payload: {
      textSnippet: {
        content: content,
        mimeType: 'text/plain', // Types: 'test/plain', 'text/html'
      },
    },
  };

  const [response] = await client.predict(request).catch(err => console.log(err));

  for (const annotationPayload of response.payload) {
    console.log(
      `Text Extract Entity Types: ${annotationPayload.displayName}`
    );
    console.log(`Text Score: ${annotationPayload.textExtraction.score}`);
    const textSegment = annotationPayload.textExtraction.textSegment;
    console.log(`Text Extract Entity Content: ${textSegment.content}`);
    console.log(`Text Start Offset: ${textSegment.startOffset}`);
    console.log(`Text End Offset: ${textSegment.endOffset}`);
  }
}

module.exports.predict = predict;