import { Bot, Minimize2, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatbotWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Bonjour ! Je suis votre assistant SEN_ARCHIV. Comment puis-je vous aider ?',
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (open) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            inputRef.current?.focus();
        }
    }, [open, messages]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text || loading) return;

        const history = messages.map((m) => ({ role: m.role, content: m.content }));

        setMessages((prev) => [...prev, { role: 'user', content: text }]);
        setInput('');
        setLoading(true);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '';

            const res = await fetch('/chatbot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({ message: text, history }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error ?? `Erreur ${res.status}`);
            }

            const data = await res.json();
            setMessages((prev) => [...prev, { role: 'assistant', content: data.message }]);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Une erreur est survenue.';
            setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3">
            {/* Chat window */}
            {open && (
                <div className="flex h-[500px] w-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between bg-[oklch(0.22_0.05_250)] px-4 py-3">
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-[oklch(0.65_0.19_45)]" />
                            <span className="font-semibold text-white text-sm">Assistant SEN_ARCHIV</span>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-white/60 transition-colors hover:text-white"
                            aria-label="Fermer"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 space-y-3 overflow-y-auto p-4">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'rounded-br-sm bg-[oklch(0.65_0.19_45)] text-white'
                                            : 'rounded-bl-sm bg-muted text-foreground'
                                    }`}
                                    style={{ whiteSpace: 'pre-wrap' }}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="flex items-end gap-2 border-t border-border p-3">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Posez votre question…"
                            disabled={loading}
                            className="max-h-24 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[oklch(0.65_0.19_45)] disabled:opacity-50"
                            style={{ overflowY: 'auto' }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || loading}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[oklch(0.65_0.19_45)] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                            aria-label="Envoyer"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle button */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[oklch(0.65_0.19_45)] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                aria-label={open ? 'Fermer le chatbot' : 'Ouvrir le chatbot'}
            >
                {open ? <Minimize2 className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
            </button>
        </div>
    );
}
