import { AzureChatOpenAI } from "@langchain/openai"
import { createAgent } from "langchain";
import { rollDice, retrieve } from "./tools.js"
import { MemorySaver } from "@langchain/langgraph";
import * as z from "zod";

const checkpointer = new MemorySaver();
const model = new AzureChatOpenAI({ temperature: 0.2 });

const myToolResponse = z.object({
  message: z.string().describe("The message to the user"),
  toolsUsed: z.array(z.string()).describe("List with names of tools used in the response, without the word function"),
  sources: z.array(z.string()).describe("The document names (e.g. 'monsters-A-Z.md') from the [Source: ...] markers returned by the retrieve tool that you used for this answer. Empty array if the retrieve tool was not used.")
});

const agent = createAgent({
  model,
  tools: [rollDice, retrieve],
  responseFormat: myToolResponse,
  checkpointer,
  systemPrompt: "Je bent The Loremaster, een Dungeon Master assistent voor Dungeons & Dragons. Voor vragen over regels, monsters of spreuken gebruik je de retrieve tool om in de D&D regelboeken te zoeken; verzin nooit zelf regels. Als je de retrieve tool gebruikt, zet dan in het 'sources' veld de documentnamen uit de [Source: ...] markeringen die je gebruikt hebt. Je kan ook dobbelstenen gooien. Je kan markdown gebruiken waar nodig."
});

export async function callAgent(prompt, userId = "anon") {
  try {
    const result = await agent.invoke({
      messages: [{ role: "user", content: prompt }],
    }, { configurable: { thread_id: userId } });
    // alleen het laatste bericht
    console.log(result.structuredResponse)
    return result.structuredResponse;
  } catch (error) {
    console.error("Azure OpenAI error:", error);
    return { message: "Sorry, the assistant is currently unavailable.", toolsUsed: [], sources: [] };
  }
}