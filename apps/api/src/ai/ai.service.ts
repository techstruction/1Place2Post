import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const PLATFORMS = ['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'YOUTUBE', 'TWITTER'];
const TONES = ['professional', 'casual', 'witty', 'inspirational', 'urgent'];

const MOCK_CAPTIONS: Record<string, string[]> = {
    INSTAGRAM: [
        "✨ {topic} is here to change the game. Are you ready? Drop a 💬 below!",
        "The secret to {topic}? Consistency, creativity, and community. Let's go! 🚀",
        "We've been working on something special around {topic} — and it's finally here. 👀",
    ],
    TIKTOK: [
        "POV: You just discovered {topic} and your mind is blown 🤯 #fyp",
        "Things nobody tells you about {topic} (save this!) 📌",
        "Watch till the end — this {topic} tip changed everything 🔥",
    ],
    FACEBOOK: [
        "We're excited to share our latest work on {topic}. What do you think? Comment below! 👇",
        "Big news about {topic} — click to find out more and share with a friend who needs this!",
        "A quick update on {topic}: here's what's new and why it matters to you.",
    ],
    YOUTUBE: [
        "In today's video, we dive deep into {topic}. Don't forget to like and subscribe! 🎬",
        "Everything you need to know about {topic} — your ultimate guide is live now.",
        "{topic} explained in under 5 minutes. Watch now and level up your knowledge!",
    ],
    TWITTER: [
        "Hot take: {topic} is the most underrated opportunity right now. Thread 🧵",
        "Just published a deep dive on {topic}. Here's what surprised me most 👇",
        "Quick tip about {topic} that'll save you hours. RT if helpful! ⏱",
    ],
};

const MOCK_HASHTAGS: Record<string, string[]> = {
    INSTAGRAM: ['#contentcreator', '#socialmedia', '#growthmindset', '#marketing', '#entrepreneurlife'],
    TIKTOK: ['#fyp', '#trending', '#learnontiktok', '#growthhack', '#viral'],
    FACEBOOK: ['#community', '#business', '#update', '#share', '#socialmediamarketing'],
    YOUTUBE: ['#youtube', '#tutorial', '#howto', '#educational', '#subscribe'],
    TWITTER: ['#thread', '#marketing', '#startup', '#growth', '#contentmarketing'],
};

@Injectable()
export class AiService {
    private readonly mode: string;
    private readonly llmUrl: string | undefined;
    private readonly llmKey: string | undefined;
    private readonly llmModel: string | undefined;

    constructor(private config: ConfigService) {
        this.mode = config.get('AI_MODE') ?? 'mock';
        this.llmUrl = config.get('LLM_PROVIDER_URL');
        this.llmKey = config.get('LLM_API_KEY');
        this.llmModel = config.get('LLM_MODEL') ?? 'gpt-4o-mini';
    }

    async generateCaption(topic: string, platform: string, tone?: string) {
        if (this.mode === 'mock' || !this.llmUrl) {
            return this.mockGenerate(topic, platform, tone);
        }
        return this.llmGenerate(topic, platform, tone);
    }

    private mockGenerate(topic: string, platform: string, tone?: string) {
        const captions = MOCK_CAPTIONS[platform] ?? MOCK_CAPTIONS.INSTAGRAM;
        const hashtags = MOCK_HASHTAGS[platform] ?? MOCK_HASHTAGS.INSTAGRAM;
        const template = captions[Math.floor(Math.random() * captions.length)];
        const caption = template.replace(/\{topic\}/g, topic);
        return { caption, hashtags: hashtags.slice(0, 5), mode: 'mock' as const };
    }

    private async llmGenerate(topic: string, platform: string, tone?: string) {
        const systemPrompt = `You are a social media expert writing ${platform} captions. Tone: ${tone ?? 'professional'}.`;
        const userPrompt = `Write a compelling ${platform} caption about: "${topic}". Return JSON: {caption: string, hashtags: string[]}`;
        const res = await fetch(`${this.llmUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.llmKey}` },
            body: JSON.stringify({ model: this.llmModel, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], response_format: { type: 'json_object' } }),
            signal: AbortSignal.timeout(30_000),
        });
        const data = await res.json();
        const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? '{}');
        return { ...parsed, mode: 'llm' as const };
    }
}
