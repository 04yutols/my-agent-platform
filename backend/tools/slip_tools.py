from langchain_core.tools import tool

@tool
def search_slip_info(slip_id: str):
    """
    伝票番号(slip_id)を元に、現在の配送情報を検索します。
    """
    # 実際はここでDBやAPIを叩く
    mock_data = {
        "12345": {"origin": "東京都千代田区", "destination": "愛知県名古屋市", "status": "完了"}
    }
    return mock_data.get(slip_id, "指定された伝票は見つかりませんでした。")

@tool
def create_investigation_report(destination: str, note: str):
    """
    新しいテスト伝票や調査レポートをシステムに作成・記録します。
    """
    # 実際はここでスプレッドシートAPIなどを叩く
    return f"宛先を『{destination}』に設定したレポート（備考: {note}）を正常に作成しました。"