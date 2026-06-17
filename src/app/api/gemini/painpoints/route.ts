import { NextResponse } from 'next/server';

import { GoogleGenerativeAI } from '@google/generative-ai';


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    const { questionsAndAnswers } = await req.json();
    console.log('qanda:', questionsAndAnswers);

    // Combine the Q&A strings into a single formatted block
    const formattedQanda = questionsAndAnswers.join('\n\n');

    const painPointPrompt = `
        You will give detail about the pain points of the user based on the following Q&A.
        You will be provided with a list of questions and answers.
        Each question is followed by its corresponding answer.
        Your goal is to determine the pain points based on the content provided.
        The result should be descriptive and should include bullet points.
        Do not give subpoints as inside parent  points and make the subpoints appear seperately as different points 
        You can  shortly explain each points but do not give any nested point and you should as many number of points as possible without any subpoints 
        Here is the Q&A:
        ${formattedQanda}
    `;

    console.log('Pain Point Prompt:', painPointPrompt);

    try {
        const model = genAI.getGenerativeModel({ model: 'gemma-4-31b-it' });
        const painPointResult = await model.generateContent(painPointPrompt);
        const painPointText = (await painPointResult.response).text().trim();
        console.log('Pain Point Result:', painPointText);

        return NextResponse.json({ painPoints: painPointText }, { status: 200 });
    } catch (error) {
        console.error('Error generating pain points:', error);
        return NextResponse.json({ error: 'Failed to generate pain points' }, { status: 500 });
    }
}
