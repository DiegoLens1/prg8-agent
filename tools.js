import { tool } from "langchain";
import { AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const embeddings = new AzureOpenAIEmbeddings({
  temperature: 0,
  azureOpenAIApiEmbeddingsDeploymentName:
    process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME,
});
const vectorStore = await FaissStore.load("./documents", embeddings);
console.log("✅ vector store loaded!");

export const retrieve = tool(
  async ({ query }) => {
    console.log(`🔧 now searching the document store with query: ${query}`);
    const relevantDocs = await vectorStore.similaritySearch(query, 2);

    // source from metadata
    const sourceOf = (doc) => (doc.metadata?.source ?? "unknown").split(/[/\\]/).pop();
    const sources = [...new Set(relevantDocs.map(sourceOf))];
    console.log(`found in document(s): ${sources.join(", ")}`);

    // add source to context
    const context = relevantDocs
      .map((doc) => `[Source: ${sourceOf(doc)}]\n${doc.pageContent}`)
      .join("\n\n");
    return context;
  },
  {
    name: "retrieve",
    description:
      "Zoek informatie op in de D&D regelboeken (SRD). Gebruik dit voor vragen over regels, monsters, spreuken en spelmechanieken.",
    schema: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
);

export const rollDice = tool(({ sides }) => {
  console.log(`🔧 Ik rol een ${sides}-sided dobbelsteen!`)
  const result = Math.floor(Math.random() * sides) + 1
  return `Ik gooide een ${result}`
}, {
  name: "roll_dice",
  description: "roll a dice and see the results",
  schema: {
    type: "object",
    properties: {
      sides: { type: "number" }
    },
    required: ["sides"],
  },
},)