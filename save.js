import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

// Documenten laden
const loader = new DirectoryLoader("./public/originals", {
  ".md": (path) => new TextLoader(path),
});
const docs = await loader.load();
console.log(`${docs.length} document(en) geladen`);

// Opsplitsen in chunks
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const chunks = await textSplitter.splitDocuments(docs);
console.log(`${chunks.length} chunks gemaakt`);

// Embeddings
const embeddings = new AzureOpenAIEmbeddings({
  temperature: 0,
  azureOpenAIApiEmbeddingsDeploymentName:
    process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME,
});

// Faiss vector store
const vectorStore = new FaissStore(embeddings, {});
await vectorStore.addDocuments(chunks);

// Opslaan in ./documents
await vectorStore.save("./documents");
console.log("vector store opgeslagen in ./documents");
