// store/requestStore.js
//
// Zustand store for the request builder state (pathParams, queryParams,
// headers, bodyType, bodyContent, formData, urlencodedData).
//
// ELI5: This holds ALL the inputs the user types into the request panel.
// By keeping it out of Workbench.jsx, we avoid re-rendering the entire
// workbench tree every time the user types a character in a query param.
//
// ELI5: Each child component subscribes only to the slice it needs:
//   - RequestWorkbench → reads everything
//   - Workbench → reads only what it needs (e.g., queryParams + pathParams for URL construction)
//   - Others → don't subscribe at all
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DEFAULT_PATH_PARAMS = [
  // { enabled: true, key: 'id', value: '1', description: 'Resource ID' },
]

const DEFAULT_QUERY_PARAMS = [
  { enabled: false, key: 'page', value: '1', description: 'Page number' },
  { enabled: false, key: 'page_size', value: '10', description: 'Page size' },
]

const DEFAULT_HEADERS = [
  { enabled: false, key: 'Accept', value: 'application/json', description: 'Accept format' },
  // { enabled: true, key: 'Content-Type', value: 'application/json', description: 'Content format' },
]

const DEFAULT_BODY_TYPE = 'json'
const DEFAULT_BODY_CONTENT = '{\n  "title": "New Book",\n  "author_id": 1\n}'

const DEFAULT_FORM_DATA = [
  { enabled: false, key: 'title', value: 'New Book', type: 'text', description: 'Book title' },
  // { enabled: true, key: 'author_id', value: '1', type: 'text', description: 'Author foreign key' },
  // { enabled: false, key: 'cover_image', value: '', type: 'file', file: null, description: 'Cover image upload' },
]

const DEFAULT_URLENCODED_DATA = [
  { enabled: false, key: 'format', value: 'json', description: 'Response format' },
]

export const useRequestStore = create(
  persist(
    (set) => ({
      // State
      pathParams: DEFAULT_PATH_PARAMS,
      queryParams: DEFAULT_QUERY_PARAMS,
      headers: DEFAULT_HEADERS,
      bodyType: DEFAULT_BODY_TYPE,
      bodyContent: DEFAULT_BODY_CONTENT,
      formData: DEFAULT_FORM_DATA,
      urlencodedData: DEFAULT_URLENCODED_DATA,

      // Actions
      setPathParams: (pathParams) => set({ pathParams }),
      setQueryParams: (queryParams) => set({ queryParams }),
      setHeaders: (headers) => set({ headers }),
      setBodyType: (bodyType) => set({ bodyType }),
      setBodyContent: (bodyContent) => set({ bodyContent }),
      setFormData: (formData) => set({ formData }),
      setUrlencodedData: (urlencodedData) => set({ urlencodedData }),

      // Bulk reset (called when a new target is selected, for example)
      resetRequest: () =>
        set({
          pathParams: DEFAULT_PATH_PARAMS,
          queryParams: DEFAULT_QUERY_PARAMS,
          headers: DEFAULT_HEADERS,
          bodyType: DEFAULT_BODY_TYPE,
          bodyContent: DEFAULT_BODY_CONTENT,
          formData: DEFAULT_FORM_DATA,
          urlencodedData: DEFAULT_URLENCODED_DATA,
        }),
    }),
    {
      name: 'dqs.request',
    }
  )
)
