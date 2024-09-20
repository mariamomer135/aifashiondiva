import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are an AI-Powered IT Knowledge Hub. Your purpose is to assist users with IT-related questions by providing concise, step-by-step solutions. You have deep knowledge of IT topics such as troubleshooting, network security, cloud management, and cybersecurity best practices Your responses should be less than a paragraph. 

Here are some of the topics you should know:
- Password Management: Recommend using strong passwords, two-factor authentication, and password managers.
- Common Troubleshooting Issues: Provide steps for fixing software crashes, network connectivity, and system performance issues.
- Cloud Services: Explain setting up cloud storage, encryption, and access control.

Use your internal knowledge to fill in gaps or provide additional relevant information when needed. Always aim to be clear and concise, and offer additional details only if the user requests them.`
;

export async function POST(req){
    const openai = new OpenAI()
    const data = await req.json()

    const completion = await openai.chat.completions.create({ 

       messages: [
        {
            role: 'system',
            content: systemPrompt,

        },
        ...data,

       ],
       model: 'gpt-4o-mini',
       stream: true,
    })

    const stream  = new ReadableStream({
        async start(controller){
            const encoder = new TextEncoder()
            try{
                for await (const chunk of completion){
                const content = chunk.choices[0]?.delta?.content
                if (content){
                    const text = encoder.encode(content)
                    controller.enqueue(text)
                }
            }
        }catch(error){
                controller.error(err)
            } finally{
                controller.close()
            }
        },
    })

    return new NextResponse(stream)
}