import fs from 'fs';
import path from 'path';
import MarkdownRenderer from '../../../components/MarkdownRenderer';

export default async function AdminGuidePage() {
    const filePath = path.join(process.cwd(), 'docs', 'ADMIN_GUIDE.md');
    const content = fs.readFileSync(filePath, 'utf8');

    return (
        <div className="card" style={{ padding: '3rem', backgroundColor: 'var(--bg-card)' }}>
            <MarkdownRenderer content={content} />
        </div>
    );
}
