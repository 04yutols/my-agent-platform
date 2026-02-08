import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from agents.graph import app_graph
from langchain_core.messages import HumanMessage, AIMessage

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatInput(BaseModel):
    thread_id: str  # セッション維持用のID
    message: Optional[str] = None
    action: Optional[str] = None # "approve" or "reject"

@app.post("/chat")
async def chat(input_data: ChatInput):
    config = {"configurable": {"thread_id": input_data.thread_id}}
    
    # 1. ユーザーからの新規メッセージがある場合
    if input_data.message:
        input_state = {"messages": [HumanMessage(content=input_data.message)]}
        # 実行
        output = app_graph.invoke(input_state, config)
    
    # 2. 承認アクションの場合 (interruptからの再開)
    elif input_data.action == "approve":
        # Noneを渡してそのまま再開（次のノードである"tools"が実行される）
        output = app_graph.invoke(None, config)
    
    elif input_data.action == "reject":
        # 却下された場合はエージェントに「ユーザーが拒否した」と伝えて再考させる
        output = app_graph.invoke(
            {"messages": [HumanMessage(content="ユーザーがツールの実行を却下しました。別の方法を提案してください。")]}, 
            config
        )

    # 現在の状態を確認
    state = app_graph.get_state(config)
    last_msg = state.values["messages"][-1]
    
    # ツール呼び出し中（中断中）かどうかを判定
    is_pending = len(state.next) > 0 and state.next[0] == "tools"
    
    return {
        "content": last_msg.content if last_msg.content else "処理を確認してください。",
        "is_pending": is_pending,
        "tool_calls": getattr(last_msg, "tool_calls", []) if is_pending else [],
        "history": [m.content for m in state.values["messages"]]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)