'use client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownRenderer({ content }: { content: string }) {
    return (
        <div className="markdown-body" style={{ lineHeight: 1.6, color: 'var(--text-main)' }}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({ node, ...props }) => <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--color-heading)' }} id={props.children?.toString().toLowerCase().replace(/\s+/g, '-')} {...props} />,
                    h2: ({ node, ...props }) => <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '2.5rem', marginBottom: '1rem', paddingBottom: '0.3rem', borderBottom: '1px solid var(--border)', color: 'var(--color-heading)' }} id={String(props.children).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()} {...props} />,
                    h3: ({ node, ...props }) => <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginTop: '2rem', marginBottom: '0.8rem', color: 'var(--color-heading)' }} {...props} />,
                    p: ({ node, ...props }) => <p style={{ marginBottom: '1.2rem', fontSize: '1rem' }} {...props} />,
                    ul: ({ node, ...props }) => <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.2rem', listStyleType: 'disc' }} {...props} />,
                    ol: ({ node, ...props }) => <ol style={{ paddingLeft: '1.5rem', marginBottom: '1.2rem', listStyleType: 'decimal' }} {...props} />,
                    li: ({ node, ...props }) => <li style={{ marginBottom: '0.4rem' }} {...props} />,
                    a: ({ node, ...props }) => <a style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }} {...props} />,
                    blockquote: ({ node, ...props }) => (
                        <blockquote style={{
                            borderLeft: '4px solid var(--primary)',
                            padding: '1rem 1.5rem',
                            margin: '1.5rem 0',
                            backgroundColor: 'rgba(111, 66, 193, 0.05)',
                            borderRadius: '0 8px 8px 0',
                            color: 'var(--text-dim)',
                            fontStyle: 'italic'
                        }} {...props} />
                    ),
                    code: ({ node, inline, ...props }: any) =>
                        inline
                            ? <code style={{ backgroundColor: 'var(--bg-main)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.9em', fontFamily: 'monospace' }} {...props} />
                            : <pre style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', overflowX: 'auto', marginBottom: '1.5rem' }}><code style={{ fontFamily: 'monospace', fontSize: '0.9em' }} {...props} /></pre>,
                    table: ({ node, ...props }) => <table className="table-wrap" style={{ width: '100%', marginBottom: '1.5rem', borderCollapse: 'collapse' }} {...props} />,
                    th: ({ node, ...props }) => <th style={{ textAlign: 'left', padding: '0.8rem', backgroundColor: 'var(--bg-main)', borderBottom: '2px solid var(--border)' }} {...props} />,
                    td: ({ node, ...props }) => <td style={{ padding: '0.8rem', borderBottom: '1px solid var(--border)' }} {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
