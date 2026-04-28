'use client';
import { useState } from 'react';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
type Props = { workspaceId: string; onClose: (connected?: boolean) => void };
export default function TelegramModal({ workspaceId, onClose }: Props) {
    const [botToken, setBotToken] = useState('');
    const [channelUsername, setChannelUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function connect(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const token = localStorage.getItem('1p2p_token');
            const res = await fetch(`${API}/social/telegram/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ botToken, channelUsername, workspaceId }),
            });
            if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
            onClose(true);
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); }
    }

    return (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
            <div className="card" style={{ width:460,maxWidth:'90vw',padding:'1.5rem' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
                    <h2 style={{ fontSize:'1rem',fontWeight:700 }}>Connect Telegram Channel</h2>
                    <button onClick={()=>onClose()} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'1.2rem' }}>✕</button>
                </div>
                <div style={{ background:'var(--bg-card)',border:'1px solid var(--border-default)',borderRadius:8,padding:'0.75rem',marginBottom:'1rem',fontSize:'0.8rem',color:'var(--text-muted)' }}>
                    <strong style={{ color:'var(--text-primary)' }}>Setup steps:</strong><br/>
                    1. Open Telegram and message <strong>@BotFather</strong><br/>
                    2. Send <code>/newbot</code> and follow prompts to create a bot<br/>
                    3. Copy the bot token (looks like <code>123456:ABC-DEF...</code>)<br/>
                    4. Add your bot as <strong>Administrator</strong> to your channel<br/>
                    5. Paste the bot token and channel username below
                </div>
                {error && <div className="alert-error" style={{ marginBottom:'0.75rem' }}>{error}</div>}
                <form onSubmit={connect}>
                    <div className="form-group">
                        <label className="form-label">Bot Token *</label>
                        <input className="form-input" required value={botToken} onChange={e=>setBotToken(e.target.value)} placeholder="1234567890:AABBCC..." type="password" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Channel Username *</label>
                        <input className="form-input" required value={channelUsername} onChange={e=>setChannelUsername(e.target.value)} placeholder="@mychannel" />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ background:'#2CA5E0',width:'100%' }} disabled={loading}>
                        {loading ? 'Connecting…' : '✈ Connect Channel'}
                    </button>
                </form>
            </div>
        </div>
    );
}
