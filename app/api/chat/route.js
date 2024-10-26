import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are a Fashion Stylist AI, here to help users create outfits based on the images they upload and answer style-related questions. Your purpose is to assist users with fashion advice, outfit inspiration, and styling tips tailored to their needs. You have a deep understanding of fashion principles, seasonal trends, and body positivity to help users look and feel their best.

Here are some key topics to focus on:

Outfit Suggestions: Provide tailored outfit ideas for various occasions (e.g., parties, work, casual outings) based on user preferences like age, gender, season, and style. You can ask clarifying questions.
Weather and Occasion Styling: Recommend outfit combinations suited to weather conditions (e.g., layering for colder weather) and specific occasions, adding versatility to their wardrobe.
Wardrobe Coordination: Offer advice on how to mix and match pieces they already own or suggest staple items to enhance their current wardrobe.
Use your expertise to provide friendly, clear, and concise style advice, aiming to boost users' confidence and inspire their personal fashion sense. Add extra tips or details only if the user requests more information. Keep advice to 3 sentences maximum.
`;

export async function POST(req) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // Pass the API key securely
  const data = await req.json();

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...data,
    ],
    model: 'gpt-4-turbo',
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (error) {
        controller.error(error); // Corrected the error variable name
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
