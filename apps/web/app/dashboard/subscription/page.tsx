'use client';
import { useState } from 'react';

const PLANS = [
    {
        id: 'free',
        name: 'Starter',
        price: '$0',
        period: 'forever',
        features: [
            { name: 'Up to 3 Social Accounts', included: true },
            { name: '10 Posts per month', included: true },
            { name: 'Basic Analytics', included: true },
            { name: 'Team Workspaces', included: false },
            { name: 'AI Studio access', included: false },
            { name: 'Webhook automations', included: false },
        ]
    },
    {
        id: 'low',
        name: 'Creator',
        price: '$19',
        period: 'per month',
        popular: true,
        features: [
            { name: 'Up to 10 Social Accounts', included: true },
            { name: '100 Posts per month', included: true },
            { name: 'Advanced Analytics', included: true },
            { name: 'Team Workspaces (3 users)', included: true },
            { name: 'AI Studio access', included: false },
            { name: 'Webhook automations', included: false },
        ]
    },
    {
        id: 'medium',
        name: 'Professional',
        price: '$49',
        period: 'per month',
        features: [
            { name: 'Up to 25 Social Accounts', included: true },
            { name: 'Unlimited Posts', included: true },
            { name: 'Advanced Analytics', included: true },
            { name: 'Team Workspaces (10 users)', included: true },
            { name: 'AI Studio access', included: true },
            { name: 'Webhook automations', included: false },
        ]
    },
    {
        id: 'high',
        name: 'Enterprise',
        price: '$99',
        period: 'per month',
        features: [
            { name: 'Unlimited Social Accounts', included: true },
            { name: 'Unlimited Posts', included: true },
            { name: 'Custom Analytics', included: true },
            { name: 'Unlimited Team Users', included: true },
            { name: 'AI Studio access', included: true },
            { name: 'Webhook automations', included: true },
        ]
    }
];

export default function SubscriptionPage() {
    // Note: Mock functionality for UI review purposes. 
    // In production, this state would map to the authenticated user's actual Stripe/DB state.
    const [activePlan, setActivePlan] = useState('free');

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '3rem' }}>
            <div className="page-header" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '3rem' }}>
                <h1 className="page-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Upgrade your workflow</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px' }}>
                    Choose the perfect plan for your content needs. Whether you are a solo creator or a large enterprise agency, we have got you covered.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                alignItems: 'stretch'
            }}>
                {PLANS.map(plan => (
                    <div key={plan.id} className="card" style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        borderColor: activePlan === plan.id || plan.popular ? 'var(--accent)' : 'var(--border)',
                        boxShadow: plan.popular ? '0 8px 32px rgba(124, 92, 252, 0.15)' : 'var(--shadow)',
                        transform: plan.popular ? 'scale(1.02)' : 'none',
                        zIndex: plan.popular ? 1 : 0
                    }}>
                        {plan.popular && (
                            <div style={{
                                position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                                background: 'var(--accent)', color: 'white', padding: '0.2rem 0.8rem',
                                borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Most Popular
                            </div>
                        )}

                        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.2rem', color: plan.popular ? 'var(--text)' : 'var(--text-muted)', marginBottom: '0.5rem' }}>{plan.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.2rem' }}>
                                <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{plan.price}</span>
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>/{plan.period}</span>
                            </div>
                        </div>

                        <button
                            className={`btn ${activePlan === plan.id ? 'btn-ghost' : plan.popular ? 'btn-primary' : 'btn-ghost'}`}
                            style={{ width: '100%', marginBottom: '2rem', justifyContent: 'center' }}
                            onClick={() => setActivePlan(plan.id)}
                            disabled={activePlan === plan.id}
                        >
                            {activePlan === plan.id ? 'Current Plan' : 'Select Plan'}
                        </button>

                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Includes:
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.5rem',
                                        color: feature.included ? 'var(--text)' : 'var(--text-dim)',
                                        opacity: feature.included ? 1 : 0.5
                                    }}>
                                        <div style={{ marginTop: '0.1rem', color: feature.included ? 'var(--success)' : 'var(--text-dim)' }}>
                                            {feature.included ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{feature.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Looking for a custom enterprise volume? <a href="/dashboard/support" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Contact Support</a>
            </div>
        </div>
    );
}
