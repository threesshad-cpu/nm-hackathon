import React, { useState, useEffect, useRef } from 'react';

const AIForeman = ({ messages, onSendMessage }) => {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (input.trim()) {
            onSendMessage(input);
            setInput("");
        }
    };

    /* ─── STATE LOGISTICS AUDIT QUERIES ─── */
    const activeQueries = [
        "Generate State Audit Report",
        "Check Energy Sovereignty Status",
        "Green TN Mission Compliance",
        "KERS efficiency audit",
        "Critical medical supply status",
        "PDS safety zone status",
        "Carbon offset progress report"
    ];

    /* ─── STATE AUDITOR QUICK ACTIONS ─── */
    const quickActions = [
        { label: "📋 Generate Audit Report", cmd: "Generate a complete state logistics audit report including fleet health, energy metrics, and supply chain efficiency.", color: "#D4AF37", textColor: "#002147" },
        { label: "🚨 Emergency Override", cmd: "Initiate emergency override protocol — report all critical missions, blocked AGVs, and low-stock zones immediately.", color: "#dc2626", textColor: "white" },
        { label: "⚡ Energy Sovereignty", cmd: "Check Energy Sovereignty Status — report KERS harvest, solar yield, carbon offset, and Green TN mission compliance.", color: "#2E7D32", textColor: "white" }
    ];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#001630',
            borderRadius: 12,
            border: '1px solid rgba(212,175,55,0.3)',
            overflow: 'hidden',
            fontFamily: '"Inter", sans-serif',
            height: '100%',
            width: '100%'
        }}>
            {/* ─── AUDITOR HEADER ─── */}
            <div style={{
                padding: '10px 14px',
                borderBottom: '2px solid #D4AF37',
                background: 'linear-gradient(90deg, #001630 0%, #002147 100%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 8, height: 8,
                        background: '#D4AF37',
                        borderRadius: '50%',
                        boxShadow: '0 0 10px #D4AF37',
                        animation: 'sovereignPulse 2s infinite'
                    }}></div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#D4AF37', letterSpacing: '1px' }}>
                        🏛️ STATE LOGISTICS AUDITOR
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{
                        fontSize: 8, fontWeight: 700, color: '#4ade80',
                        background: 'rgba(74,222,128,0.1)',
                        padding: '2px 7px', borderRadius: 4,
                        border: '1px solid rgba(74,222,128,0.3)'
                    }}>
                        TN GOVT SECURE
                    </span>
                    <span style={{
                        fontSize: 8, fontWeight: 700, color: '#94a3b8',
                        background: 'rgba(148,163,184,0.1)',
                        padding: '2px 7px', borderRadius: 4,
                        border: '1px solid rgba(148,163,184,0.2)'
                    }}>
                        V9.0
                    </span>
                </div>
            </div>

            {/* ─── MESSAGES ─── */}
            <div style={{
                flex: 1,
                padding: 12,
                overflowY: 'auto',
                background: 'linear-gradient(180deg, #001225 0%, #001630 100%)',
                display: 'flex',
                flexDirection: 'column',
                gap: 10
            }}>
                {messages.map((m, i) => (
                    <div key={i} style={{
                        alignSelf: m.type === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '88%'
                    }}>
                        <div style={{
                            background: m.type === 'user'
                                ? 'linear-gradient(135deg, #D4AF37, #b8942a)'
                                : 'rgba(255,255,255,0.05)',
                            color: m.type === 'user' ? '#002147' : '#e2e8f0',
                            padding: '9px 13px',
                            borderRadius: m.type === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                            fontSize: 11,
                            lineHeight: 1.5,
                            fontWeight: m.type === 'user' ? 700 : 400,
                            border: m.type === 'bot' ? '1px solid rgba(212,175,55,0.15)' : 'none',
                            boxShadow: m.type === 'user' ? '0 4px 12px rgba(212,175,55,0.3)' : 'none'
                        }}>
                            {m.text}
                        </div>
                        {m.type === 'bot' && (
                            <div style={{
                                fontSize: 8,
                                color: '#D4AF37',
                                marginTop: 3, marginLeft: 4,
                                display: 'flex', alignItems: 'center', gap: 4,
                                fontWeight: 700
                            }}>
                                <span style={{ width: 4, height: 4, background: '#D4AF37', borderRadius: '50%', display: 'inline-block' }}></span>
                                🏛️ TN STATE LOGISTICS BRIEFING
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* ─── SUGGESTED QUERIES ─── */}
            <div style={{
                padding: '6px 10px',
                display: 'flex',
                gap: 5,
                overflowX: 'auto',
                borderTop: '1px solid rgba(212,175,55,0.15)',
                background: '#001225',
                scrollbarWidth: 'none'
            }}>
                {activeQueries.map((q, i) => (
                    <button key={i}
                        onClick={() => onSendMessage(q)}
                        style={{
                            flexShrink: 0,
                            background: 'rgba(212,175,55,0.08)',
                            border: '1px solid rgba(212,175,55,0.2)',
                            color: '#D4AF37',
                            padding: '3px 9px',
                            borderRadius: 12,
                            fontSize: 9,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(212,175,55,0.2)';
                            e.currentTarget.style.borderColor = '#D4AF37';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(212,175,55,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)';
                        }}
                    >
                        {q}
                    </button>
                ))}
            </div>

            {/* ─── QUICK ACTION COMMAND BUTTONS ─── */}
            <div style={{ padding: '6px 10px', display: 'flex', gap: 5, background: '#001225' }}>
                {quickActions.map((action, i) => (
                    <button key={i}
                        onClick={() => onSendMessage(action.cmd)}
                        style={{
                            flex: 1,
                            background: action.color,
                            border: 'none',
                            color: action.textColor,
                            padding: '7px 4px',
                            borderRadius: 6,
                            fontSize: 8.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: `0 2px 8px ${action.color}44`,
                            transition: 'all 0.2s',
                            letterSpacing: '0.2px'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        {action.label}
                    </button>
                ))}
            </div>

            {/* ─── INPUT BAR ─── */}
            <div style={{ padding: '8px 10px', borderTop: '1px solid rgba(212,175,55,0.15)', background: '#001225' }}>
                <div style={{ display: 'flex', gap: 7 }}>
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Audit query: rice stocks, PDS status, energy sovereignty..."
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(212,175,55,0.3)',
                            outline: 'none',
                            fontSize: 11,
                            color: '#e2e8f0',
                            background: 'rgba(255,255,255,0.05)',
                            fontFamily: 'Inter, sans-serif',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#D4AF37'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(212,175,55,0.3)'}
                    />
                    <button
                        onClick={handleSend}
                        style={{
                            background: 'linear-gradient(135deg, #D4AF37, #b8942a)',
                            color: '#002147',
                            border: 'none',
                            borderRadius: 8,
                            width: 38,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 14,
                            fontWeight: 900,
                            boxShadow: '0 2px 8px rgba(212,175,55,0.4)'
                        }}
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIForeman;
