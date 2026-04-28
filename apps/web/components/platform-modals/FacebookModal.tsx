'use client';
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:35763/api';
type Props = { workspaceId: string; onClose: (connected?: boolean) => void };
export default function FacebookModal({ workspaceId, onClose }: Props) {
    function connect() {
        const token = localStorage.getItem('1p2p_token');
        window.location.href = `${API}/social/facebook/auth?token=${token}&workspaceId=${workspaceId}`;
    }
    return (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
            <div className="card" style={{ width:420,maxWidth:'90vw',padding:'1.5rem' }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem' }}>
                    <h2 style={{ fontSize:'1rem',fontWeight:700 }}>Connect Facebook Page</h2>
                    <button onClick={()=>onClose()} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'1.2rem' }}>✕</button>
                </div>
                <p style={{ color:'var(--text-muted)',fontSize:'0.875rem',marginBottom:'1rem' }}>
                    Connect a Facebook Page you manage. You will be prompted to select which pages to grant access to.
                </p>
                <button className="btn btn-primary" style={{ background:'#1877F2',width:'100%' }} onClick={connect}>
                    🔗 Connect via Facebook
                </button>
            </div>
        </div>
    );
}
