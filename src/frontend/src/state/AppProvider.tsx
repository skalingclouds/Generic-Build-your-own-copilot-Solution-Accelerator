import React, { createContext, ReactNode, useEffect, useReducer } from 'react'

import {
  ChatHistoryLoadingState,
  Conversation,
  CosmosDBHealth,
  CosmosDBStatus,
  DraftedDocument,
  Section,
  Feedback,
  FrontendSettings,
  frontendSettings,
  historyEnsure,
  historyList
} from '../api'

import { appStateReducer } from './AppReducer'

export interface AppState {
  isChatHistoryOpen: boolean
  chatHistoryLoadingState: ChatHistoryLoadingState
  isCosmosDBAvailable: CosmosDBHealth
  chatHistory: Conversation[] | null
  filteredChatHistory: Conversation[] | null
  currentChat: Conversation | null
  browseChat: Conversation | null
  generateChat: Conversation | null
  frontendSettings: FrontendSettings | null
  feedbackState: { [answerId: string]: Feedback.Neutral | Feedback.Positive | Feedback.Negative }
  draftedDocument: DraftedDocument | null
  draftedDocumentTitle: string
  isGenerating: boolean
  isRequestInitiated : boolean,
  failedSections : Section[],
  isFailedReqInitiated : boolean,
  isLoading: boolean,
  isLoadedSections: Section[]
}

export type Action =
  | { type: 'TOGGLE_CHAT_HISTORY' }
  | { type: 'SET_COSMOSDB_STATUS'; payload: CosmosDBHealth }
  | { type: 'UPDATE_CHAT_HISTORY_LOADING_STATE'; payload: ChatHistoryLoadingState }
  | { type: 'UPDATE_CURRENT_CHAT'; payload: Conversation | null }
  | { type: 'UPDATE_FILTERED_CHAT_HISTORY'; payload: Conversation[] | null }
  | { type: 'UPDATE_CHAT_HISTORY'; payload: Conversation }
  | { type: 'UPDATE_CHAT_TITLE'; payload: Conversation }
  | { type: 'DELETE_CHAT_ENTRY'; payload: string }
  | { type: 'DELETE_CHAT_HISTORY' }
  | { type: 'DELETE_CURRENT_CHAT_MESSAGES'; payload: string }
  | { type: 'FETCH_CHAT_HISTORY'; payload: Conversation[] | null }
  | { type: 'FETCH_FRONTEND_SETTINGS'; payload: FrontendSettings | null }
  | {
      type: 'SET_FEEDBACK_STATE'
      payload: { answerId: string; feedback: Feedback.Positive | Feedback.Negative | Feedback.Neutral }
    }
  | { type: 'GET_FEEDBACK_STATE'; payload: string }
  | { type: 'UPDATE_SECTION'; payload: { sectionIdx: number; section: Section } }
  | { type: 'UPDATE_DRAFTED_DOCUMENT'; payload: DraftedDocument }
  | { type: 'UPDATE_BROWSE_CHAT'; payload: Conversation | null }
  | { type: 'UPDATE_GENERATE_CHAT'; payload: Conversation | null }
  | { type: 'UPDATE_DRAFTED_DOCUMENT_TITLE'; payload: string }
  | { type: 'GENERATE_ISLODING'; payload: boolean }
  | { type: 'SET_IS_REQUEST_INITIATED'; payload: boolean }

  | { type: 'ADD_FAILED_SECTION'; payload: Section }
  | { type: 'REMOVED_FAILED_SECTION'; payload: {section : Section} }
  | { type: 'UPDATE_SECTION_API_REQ_STATUS'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_IS_LOADED_SECTIONS'; payload: {section : Section | null , title ? : string , 'act'?: string} }
  
const initialState: AppState = {
  isChatHistoryOpen: false,
  chatHistoryLoadingState: ChatHistoryLoadingState.Loading,
  chatHistory: null,
  filteredChatHistory: null,
  currentChat: null,
  browseChat: null,
  generateChat: null,
  isCosmosDBAvailable: {
    cosmosDB: false,
    status: CosmosDBStatus.NotConfigured
  },
  frontendSettings: null,
  feedbackState: {},
  draftedDocument: null,
  draftedDocumentTitle: '',
  isGenerating: false,
  isRequestInitiated: false,
  failedSections : [],
  isFailedReqInitiated : false,
  isLoading: false,
  isLoadedSections: []

}

export const AppStateContext = createContext<
  | {
      state: AppState
      dispatch: React.Dispatch<Action>
    }
  | undefined
>(undefined)

type AppStateProviderProps = {
  children: ReactNode
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState)

  useEffect(() => {
    const getHistoryEnsure = async () => {
      dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Loading })
      historyEnsure()
        .then(response => {
          if (response?.cosmosDB) {
            dispatch({ type: 'SET_COSMOSDB_STATUS', payload: response })
            dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Success })
          } else {
            dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Fail })
            dispatch({ type: 'SET_COSMOSDB_STATUS', payload: response })
          }
        })
        .catch(_err => {
          dispatch({ type: 'UPDATE_CHAT_HISTORY_LOADING_STATE', payload: ChatHistoryLoadingState.Fail })
          dispatch({ type: 'SET_COSMOSDB_STATUS', payload: { cosmosDB: false, status: CosmosDBStatus.NotConfigured } })
        })
    }
    getHistoryEnsure()
  }, [])

  useEffect(() => {
    const getFrontendSettings = async () => {
      frontendSettings()
        .then(response => {
          dispatch({ type: 'FETCH_FRONTEND_SETTINGS', payload: response as FrontendSettings })
        })
        .catch(_err => {
          console.error('There was an issue fetching your data.')
        })
    }
    getFrontendSettings()
  }, [])

  return <AppStateContext.Provider value={{ state, dispatch }}>{children}</AppStateContext.Provider>
}
