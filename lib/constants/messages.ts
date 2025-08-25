// 統一された日本語メッセージ定数
export const MESSAGES = {
  // 一般
  LOADING: '読み込み中...',
  CONNECTING: '接続中...',
  PLEASE_WAIT: 'しばらくお待ちください',
  
  // 認証関連
  AUTH: {
    LOGIN_REQUIRED: 'ログインが必要です',
    INVALID_PASSWORD: 'パスワードが間違っています',
    INVALID_QR_CODE: '無効なQRコードまたはIDです',
    SESSION_EXPIRED: 'セッションの有効期限が切れました。再度ログインしてください',
    LOGOUT_SUCCESS: 'ログアウトしました',
  },
  
  // クイズ関連
  QUIZ: {
    LOADING_QUESTION: '問題を読み込んでいます...',
    WAITING_START: 'まもなくクイズが始まります',
    WAITING_NEXT: '次の問題をお待ちください',
    ANSWER_RECEIVED: '回答を受け付けました！',
    ALREADY_ANSWERED: 'すでに回答済みです',
    TIME_UP: '時間切れです',
    SELECT_ANSWER: '選択肢を選んでください',
    INPUT_ANSWER: '回答を入力してください',
    SUBMITTING: '送信中...',
    SUBMIT_ANSWER: '回答を送信',
  },
  
  // 結果関連
  RESULTS: {
    CURRENT_SCORE: '現在のスコア',
    CORRECT_COUNT: '正解数',
    ACCURACY_RATE: '正解率',
    RANKING: 'ランキング',
    FINAL_RANKING: '最終ランキング',
    THANK_YOU: 'ご参加ありがとうございました',
  },
  
  // 管理者関連
  ADMIN: {
    DASHBOARD_TITLE: 'クイズ管理ダッシュボード',
    PARTICIPANT_COUNT: '参加者数',
    CURRENT_QUESTION: '現在の問題',
    GAME_STATUS: '状態',
    START_QUIZ: 'クイズ開始',
    SHOW_QUESTION: '問題表示',
    START_ANSWERS: '回答受付開始',
    CLOSE_ANSWERS: '回答締切',
    SHOW_RESULTS: '結果発表',
    NEXT_QUESTION: '次の問題へ',
    END_QUIZ: 'クイズ終了',
    UNDO: '元に戻す',
    LAST_ACTION: '最後の操作',
  },
  
  // エラーメッセージ
  ERROR: {
    GENERAL: 'エラーが発生しました',
    SERVER_ERROR: 'サーバーエラーが発生しました',
    NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください',
    FETCH_FAILED: 'データの取得に失敗しました',
    SAVE_FAILED: 'データの保存に失敗しました',
    INVALID_INPUT: '入力内容に誤りがあります',
    TRY_AGAIN: 'もう一度お試しください',
  },
  
  // 成功メッセージ
  SUCCESS: {
    SAVED: '保存しました',
    UPDATED: '更新しました',
    DELETED: '削除しました',
    OPERATION_COMPLETE: '操作が完了しました',
  },
  
  // 状態
  STATE: {
    WAITING: '待機中',
    SHOWING_QUESTION: '問題表示中',
    ACCEPTING_ANSWERS: '回答受付中',
    SHOWING_RESULTS: '結果表示中',
    FINISHED: '終了',
  },
  
  // プレゼンテーション
  PRESENTATION: {
    WELCOME: '結婚式クイズ',
    STARTING_SOON: 'まもなく開始します',
    JOIN_MESSAGE: 'QRコードを読み取って参加してください',
    PARTICIPANTS: '参加者',
    TIME_REMAINING: '残り時間',
    ANSWERING: '回答受付中',
    CORRECT_ANSWER: '正解',
    RESULT_ANNOUNCEMENT: '結果発表',
  },
} as const