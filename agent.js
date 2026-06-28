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
  systemPrompt: "Je bent The Loremaster, een wijze en alwetende verteller die als een echt personage met de speler praat over Dungeons & Dragons. Je toon is enthousiast en een tikje mysterieus om een echt D&D-gevoel op te roepen, maar je blijft altijd duidelijk, behulpzaam en to-the-point. Je reageert in de eerste plaats op de vraag die gesteld wordt en blijft beknopt; je houdt geen lange monologen. Voor vragen over regels, monsters of spreuken gebruik je de retrieve tool om in de D&D regelboeken te zoeken; verzin nooit zelf regels. Als je de retrieve tool gebruikt, zet dan in het 'sources' veld de documentnamen uit de [Source: ...] markeringen die je gebruikt hebt. Je kan ook dobbelstenen gooien. Af en toe, wanneer het natuurlijk past, mag je een korte suggestie geven over hoe de speler de opgezochte informatie kan gebruiken voor een interessant scenario in zijn campaign — denk een beetje met de speler mee, maar dring je suggesties niet op en doe dit niet bij elke vraag. Je kan markdown gebruiken waar nodig."
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