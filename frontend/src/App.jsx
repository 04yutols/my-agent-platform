import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Send, User, Bot, Check, X, Terminal, 
  Table, Layout, ChevronRight, Search, 
  Download, Grid, MessageSquare, Settings,
  Database, Truck, Package, CreditCard,
  BarChart3, Plus, Bell, Clock, Briefcase,
  AlertCircle, ArrowRight, Loader2, ChevronLeft
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Multi-Agent Platform Prototype - Improved UX Version
 * * Features:
 * - Agent Selection Portal
 * - Rich Approval Cards with Japanese tool names
 * - Spreadsheet visualization
 */
const App = () => {
  // --- UI States ---
  const [view, setView] = useState('portal'); // 'portal' or 'chat'
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(true);
  
  // --- Agent & Data States ---
  const [threadId] = useState(`session-${Math.random().toString(36).substr(2, 9)}`);
  const [pendingTool, setPendingTool] = useState(null);
  const [spreadsheetData, setSpreadsheetData] = useState([
    { id: '12340', origin: '大阪府大阪市', destination: '福岡県福岡市', status: '完了', note: '通常配送' },
    { id: '12345', origin: '東京都千代田区', destination: '愛知県名古屋市', status: '完了', note: '精密機器' },
  ]);

  const scrollRef = useRef(null);

  // Available Agents for the Portal
  const agents = [
    { 
      id: 'logistic', 
      name: '配送伝票エージェント', 
      desc: '伝票の作成、住所変更、配送状況の確認を担当します。',
      icon: <Truck size={24} />,
      color: 'bg-indigo-600',
      status: 'Ready'
    },
    { 
      id: 'inventory', 
      name: '在庫管理エージェント', 
      desc: '在庫の引当、欠品予測、倉庫間移動の指示を行います。',
      icon: <Package size={24} />,
      color: 'bg-emerald-600',
      status: 'Ready'
    }
  ];

  // Tool metadata for human-friendly display
  const toolMetadata = {
    search_slip_info: {
      title: '伝票情報の検索',
      description: '指定された伝票の現在の配送状況と詳細をシステムから取得します。',
      icon: <Search size={16} className="text-blue-500" />
    },
    create_investigation_report: {
      title: '調査レポートの作成',
      description: 'スプレッドシートに新しい調査記録を追加し、変更内容を永続化します。',
      icon: <Database size={16} className="text-amber-500" />
    }
  };

  // Auto-scroll handler
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingTool]);

  // --- Logic Handlers ---

  const startAgent = (agent) => {
    setSelectedAgent(agent);
    setView('chat');
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: `${agent.name}を起動しました。どのような業務をお手伝いしましょうか？`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  };

  const sendMessageToAgent = async (text, action = null) => {
    setIsTyping(true);
    setPendingTool(null);

    try {
      // Logic for actual backend communication
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        thread_id: threadId,
        message: text,
        action: action
      });

      const { content, is_pending, tool_calls } = response.data;

      if (content && content !== "処理を確認してください。") {
        setMessages(prev => [...prev, {
          id: Date.now(),
          role: 'assistant',
          content: content,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }

      if (is_pending && tool_calls && tool_calls.length > 0) {
        setPendingTool(tool_calls[0]);
      }

      // Sync mock sheet data on successful report tool
      if (action === 'approve' && !is_pending) {
        // Mock update for PoC demonstration
        if (messages[messages.length-2]?.content?.includes('札幌')) {
           setSpreadsheetData(prev => [...prev, {
             id: 'TEST-' + Math.floor(Math.random() * 9000),
             origin: '東京都千代田区',
             destination: '北海道札幌市',
             status: 'テスト伝票',
             note: '自動記録',
             isNew: true
           }]);
           setTimeout(() => setSpreadsheetData(prev => prev.map(r => ({...r, isNew: false}))), 3000);
        }
      }

    } catch (error) {
      console.error("API Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'system',
        content: "Error: バックエンドとの通信に失敗しました。サーバーが起動しているか確認してください。",
        timestamp: 'Now'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    
    const text = inputValue;
    setInputValue('');
    sendMessageToAgent(text);
  };

  const handleAction = (isApproved) => {
    const action = isApproved ? 'approve' : 'reject';
    sendMessageToAgent(null, action);
  };

  // --- Views ---

  if (view === 'portal') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><Grid size={24} /></div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Agent Platform <span className="text-indigo-600">Pro</span></h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full"></span> SYSTEM ONLINE</span>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-8">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-800 mb-2">エージェントを選択</h2>
            <p className="text-slate-500">業務に応じた専門エージェントが、あなたのタスクを自律的にサポートします。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents.map(agent => (
              <div 
                key={agent.id} 
                onClick={() => startAgent(agent)} 
                className="group bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-300 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className={`w-14 h-14 ${agent.color} rounded-2xl text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  {agent.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800">{agent.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">{agent.desc}</p>
                <div className="flex items-center text-indigo-600 text-sm font-bold gap-1 group-hover:gap-3 transition-all">
                  エージェントを開始 <ArrowRight size={16} />
                </div>
              </div>
            ))}
            
            <div className="bg-slate-100 p-8 rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer">
              <Plus className="mb-2" size={32} />
              <span className="text-sm font-bold tracking-wider">NEW AGENT</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('portal')} 
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className={`${selectedAgent?.color} p-2 rounded-xl text-white shadow-md`}>
              {selectedAgent?.icon}
            </div>
            <div>
              <h1 className="font-bold text-sm text-slate-800">{selectedAgent?.name}</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Vertex AI Connected</span>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsSheetVisible(!isSheetVisible)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-all shadow-sm"
        >
          <Table size={14} />
          {isSheetVisible ? 'シートを隠す' : 'シートを表示'}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Chat Area */}
        <div className={`flex flex-col flex-1 transition-all duration-500 ease-in-out ${isSheetVisible ? 'w-full lg:w-1/2' : 'w-full'}`}>
          <main ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border text-indigo-600'
                  }`}>
                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  <div className={`px-5 py-3.5 rounded-2xl text-sm shadow-sm border ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' 
                      : 'bg-white border-slate-200 text-slate-800 rounded-tl-none leading-relaxed'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Improved Tool Approval Card */}
            {pendingTool && (
              <div className="flex justify-start ml-12 animate-in slide-in-from-bottom-4 duration-300">
                <div className="w-full max-w-md bg-white border-2 border-indigo-100 rounded-3xl overflow-hidden shadow-2xl ring-8 ring-indigo-500/5">
                  <div className="bg-indigo-600 px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-white">
                      <AlertCircle size={20} className="text-indigo-200" />
                      <span className="text-xs font-black uppercase tracking-widest">AI 実行承認リクエスト</span>
                    </div>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-5">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shrink-0 shadow-inner">
                        {toolMetadata[pendingTool.name]?.icon || <Terminal size={24} className="text-slate-400" />}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-800">
                          {toolMetadata[pendingTool.name]?.title || pendingTool.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {toolMetadata[pendingTool.name]?.description || 'この処理を実行してよろしいですか？'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">実行パラメータの確認</p>
                      <div className="space-y-2.5">
                        {Object.entries(pendingTool.args).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between text-xs group">
                            <span className="text-slate-500 font-bold">{key}</span>
                            <span className="font-mono bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-indigo-600 font-black shadow-sm group-hover:border-indigo-300 transition-colors">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        onClick={() => handleAction(true)} 
                        className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl text-xs font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Check size={18} /> 実行を承認する
                      </button>
                      <button 
                        onClick={() => handleAction(false)} 
                        className="px-5 bg-slate-100 text-slate-500 py-3.5 rounded-2xl text-xs font-bold hover:bg-slate-200 transition-all active:scale-95"
                      >
                        却下
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isTyping && (
              <div className="ml-12 flex items-center gap-2.5 text-[10px] text-slate-400 font-bold italic tracking-wide">
                <Loader2 size={12} className="animate-spin text-indigo-400" />
                AGENT IS THINKING...
              </div>
            )}
          </main>

          <footer className="p-5 bg-white border-t border-slate-100">
            <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-3">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={pendingTool ? "承認をお待ちしています..." : "エージェントに指示を入力..."}
                  disabled={!!pendingTool || isTyping}
                  className="w-full bg-slate-100 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl px-5 py-3.5 text-sm transition-all outline-none disabled:opacity-50 font-medium"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={!inputValue.trim() || !!pendingTool || isTyping}
                className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 disabled:bg-slate-300 shadow-xl shadow-indigo-100 transition-all active:scale-90"
              >
                <Send size={20} />
              </button>
            </form>
          </footer>
        </div>

        {/* Spreadsheet Preview Area */}
        <div className={`bg-white border-l border-slate-200 transition-all duration-500 ease-in-out flex flex-col ${isSheetVisible ? 'w-full lg:w-1/2' : 'w-0 pointer-events-none opacity-0'}`}>
          <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600"><Database size={16} /></div>
              <span className="font-black text-sm text-slate-800 tracking-tight">共有データシート (リアルタイム連携)</span>
            </div>
            <div className="flex gap-2">
               <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-separate border-spacing-0">
              <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm border-b z-10">
                <tr className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                  <th className="p-5 border-b border-slate-100">ID</th>
                  <th className="p-5 border-b border-slate-100">配送先住所</th>
                  <th className="p-5 border-b border-slate-100">ステータス</th>
                  <th className="p-5 border-b border-slate-100">備考</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {spreadsheetData.map(row => (
                  <tr key={row.id} className={`transition-all duration-700 ${row.isNew ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                    <td className="p-5 font-mono font-black text-indigo-600">{row.id}</td>
                    <td className="p-5 font-bold text-slate-700">{row.destination}</td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight shadow-sm ${
                        row.status === '完了' 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                          : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="p-5 text-slate-400 font-medium italic">{row.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;