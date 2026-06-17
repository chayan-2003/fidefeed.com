import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { responseId, questions, answers } = await req.json();

    console.log('Questions:', questions);
    console.log('Answers:', answers);

    // Combine questions and answers for context
    const content = questions
      .map((q: string, i: number) => `Q: ${q}\nA: ${answers[i] ?? 'N/A'}`)
      .join('\n\n');
    console.log('Content for classification:', content);

    // Spam classification prompt
    const spamPrompt = `
      You are a spam detection AI. Your task is to classify the following content as "spam" or "not spam".
      You will be provided with a list of questions and answers.
      Each question is followed by its corresponding answer.
      Your goal is to determine if the answers are spam or not based on the content provided.
      You should only respond with "spam" or "not spam" as the result.
      Questions and Answers:
      ${content}
    `;

    const model = genAI.getGenerativeModel({ model: 'gemma-4-31b-it' }); // Use a free or lower-tier model

    // Spam classification
    const spamResult = await model.generateContent(spamPrompt);
    const spamText = (await spamResult.response).text().trim().toLowerCase();
    const isSpam = spamText === 'spam';

    // Update the response in the database
    await prisma.response.update({
      where: { id: responseId },
      data: {
        spam: isSpam,
      },
    });

    return NextResponse.json({ spam: isSpam }, { status: 200 });
  } catch (err) {
    console.error('Error processing response:', err);
    return NextResponse.json({ error: 'Failed to process response' }, { status: 500 });
  }
}
