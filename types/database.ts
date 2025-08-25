export interface User {
  id: string
  qr_code: string
  name: string
  group_type: 'bride' | 'groom' | 'other'
  seat_number?: string
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  question_number: number
  question_text: string
  question_type: 'multiple_choice' | 'free_text'
  image_url?: string
  time_limit_seconds: number
  points: number
  created_at: string
  updated_at: string
}

export interface Choice {
  id: string
  question_id: string
  choice_text: string
  is_correct: boolean
  display_order: number
  created_at: string
}

export interface Answer {
  id: string
  user_id: string
  question_id: string
  choice_id?: string
  answer_text?: string
  is_correct?: boolean
  points_earned: number
  answered_at: string
}

export type GameState = 'waiting' | 'showing_question' | 'accepting_answers' | 'showing_results' | 'finished'

export interface GameStateRecord {
  id: string
  current_state: GameState
  current_question_id?: string
  current_question_number?: number
  answers_closed_at?: string
  results_shown_at?: string
  created_at: string
  updated_at: string
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  last_active: string
  created_at: string
}

export interface AdminAction {
  id: string
  action_type: string
  previous_state?: any
  new_state?: any
  performed_at: string
  undone: boolean
}