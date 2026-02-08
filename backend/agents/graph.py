import os
from typing import Annotated, TypedDict, Union
from dotenv import load_dotenv

from langchain_google_vertexai import ChatVertexAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

# ツール群のインポート
from tools.slip_tools import search_slip_info, create_investigation_report

load_dotenv()

# --- 1. State（状態）の定義 ---
class AgentState(TypedDict):
    # メッセージの履歴を保持
    messages: Annotated[list[BaseMessage], lambda x, y: x + y]

# --- 2. ツールとモデルの準備 ---
tools = [search_slip_info, create_investigation_report]
tool_node = ToolNode(tools)

# Vertex AI (Gemini) の初期化
model = ChatVertexAI(
    model_name="gemini-2.5-flash",
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_REGION", "us-central1")
).bind_tools(tools)

# --- 3. ノード（各ステップ）のロジック ---

def call_model(state: AgentState):
    """LLMを呼び出して次のアクションを決定する"""
    response = model.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state: AgentState):
    """ツールを実行すべきか、回答を終了すべきかを判断する"""
    last_message = state["messages"][-1]
    if not last_message.tool_calls:
        return END
    return "tools"

# --- 4. グラフの構築 ---
workflow = StateGraph(AgentState)

# ノードの追加
workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)

# エントリポイントの設定
workflow.set_entry_point("agent")

# 条件付きエッジ（分岐）の追加
workflow.add_conditional_edges(
    "agent",
    should_continue,
    {
        "tools": "tools",
        END: END
    }
)

# ツール実行後は再びエージェントに戻って推論を継続
workflow.add_edge("tools", "agent")

# --- 5. チェックポインター（中断と再開のため）の設定 ---
memory = MemorySaver()

# コンパイル時に「interrupt_before=["tools"]」を指定するのがポイント！
# これにより、ツール実行の直前で必ず処理が一時停止し、承認待ち状態になります。
app_graph = workflow.compile(
    checkpointer=memory,
    interrupt_before=["tools"]
)