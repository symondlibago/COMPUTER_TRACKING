import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  // PC Management
  pcs: [
    { id: 1, name: 'PC-001', status: 'available', location: 'Lab A', specs: 'Intel i5, 8GB RAM', currentUser: null, usageHistory: [] },
    { id: 2, name: 'PC-002', status: 'in-use', location: 'Lab A', specs: 'Intel i7, 16GB RAM', currentUser: { id: 1, name: 'John Doe', startTime: new Date() }, usageHistory: [] },
    { id: 3, name: 'PC-003', status: 'available', location: 'Lab B', specs: 'Intel i5, 8GB RAM', currentUser: null, usageHistory: [] },
    { id: 4, name: 'PC-004', status: 'maintenance', location: 'Lab B', specs: 'Intel i7, 16GB RAM', currentUser: null, usageHistory: [] },
    { id: 5, name: 'PC-005', status: 'available', location: 'Lab C', specs: 'Intel i5, 8GB RAM', currentUser: null, usageHistory: [] },
    { id: 6, name: 'PC-006', status: 'in-use', location: 'Lab C', specs: 'Intel i7, 16GB RAM', currentUser: { id: 2, name: 'Jane Smith', startTime: new Date() }, usageHistory: [] }
  ],
  
  // Student Management
  students: [
    { id: 1, name: 'John Doe', email: 'john@example.com', studentId: 'STU001', registrationDate: new Date() },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', studentId: 'STU002', registrationDate: new Date() },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', studentId: 'STU003', registrationDate: new Date() }
  ],
  
  // Queue System (FIFO)
  queue: [
    { id: 3, studentId: 3, studentName: 'Mike Johnson', queueTime: new Date(), requestedHours: 2, timeoutId: null }
  ],
  
  // Current User Session
  currentUser: null, // Start as null, will be loaded from localStorage
  userType: null,    // Start as null
  token: null,       // MODIFICATION: Add token to the initial state
  
  // UI State
  sidebarCollapsed: false,
  theme: 'light'
};
// Action types
const ActionTypes = {
  // PC Actions
  ADD_PC: 'ADD_PC',
  UPDATE_PC: 'UPDATE_PC',
  UPDATE_PC_STATUS: 'UPDATE_PC_STATUS',
  REMOVE_PC: 'REMOVE_PC',
  ASSIGN_PC: 'ASSIGN_PC',
  RELEASE_PC: 'RELEASE_PC',
  
  // Student Actions
  ADD_STUDENT: 'ADD_STUDENT',
  UPDATE_STUDENT: 'UPDATE_STUDENT',
  REMOVE_STUDENT: 'REMOVE_STUDENT',
  
  // Queue Actions
  JOIN_QUEUE: 'JOIN_QUEUE',
  REMOVE_FROM_QUEUE: 'REMOVE_FROM_QUEUE',
  MOVE_QUEUE_UP: 'MOVE_QUEUE_UP',
  MOVE_QUEUE_DOWN: 'MOVE_QUEUE_DOWN',
  PROCESS_QUEUE: 'PROCESS_QUEUE',
  TIMEOUT_QUEUE_ITEM: 'TIMEOUT_QUEUE_ITEM',
  
  // User Actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  
  // UI Actions
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  SET_THEME: 'SET_THEME'
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case ActionTypes.ADD_PC:
      return {
        ...state,
        pcs: [...state.pcs, { ...action.payload, id: Date.now() }]
      };
      
    case ActionTypes.UPDATE_PC:
      return {
        ...state,
        pcs: state.pcs.map(pc => 
          pc.id === action.payload.id ? { ...pc, ...action.payload } : pc
        )
      };
      
    case ActionTypes.UPDATE_PC_STATUS:
      return {
        ...state,
        pcs: state.pcs.map(pc => 
          pc.id === action.payload.pcId 
            ? { ...pc, status: action.payload.status }
            : pc
        )
      };
      
    case ActionTypes.REMOVE_PC:
      return {
        ...state,
        pcs: state.pcs.filter(pc => pc.id !== action.payload)
      };
      
    case ActionTypes.MOVE_QUEUE_UP:
      const upIndex = state.queue.findIndex(item => item.id === action.payload);
      if (upIndex > 0) {
        const newQueue = [...state.queue];
        [newQueue[upIndex], newQueue[upIndex - 1]] = [newQueue[upIndex - 1], newQueue[upIndex]];
        return { ...state, queue: newQueue };
      }
      return state;
      
    case ActionTypes.MOVE_QUEUE_DOWN:
      const downIndex = state.queue.findIndex(item => item.id === action.payload);
      if (downIndex < state.queue.length - 1) {
        const newQueue = [...state.queue];
        [newQueue[downIndex], newQueue[downIndex + 1]] = [newQueue[downIndex + 1], newQueue[downIndex]];
        return { ...state, queue: newQueue };
      }
      return state;
      
    case ActionTypes.ASSIGN_PC:
      return {
        ...state,
        pcs: state.pcs.map(pc => 
          pc.id === action.payload.pcId 
            ? { 
                ...pc, 
                status: 'in-use', 
                currentUser: action.payload.user,
                usageHistory: [...pc.usageHistory, {
                  userId: action.payload.user.id,
                  userName: action.payload.user.name,
                  startTime: new Date(),
                  endTime: null,
                  duration: null
                }]
              }
            : pc
        )
      };
      
    case ActionTypes.RELEASE_PC:
      return {
        ...state,
        pcs: state.pcs.map(pc => {
          if (pc.id === action.payload) {
            const updatedHistory = pc.usageHistory.map((session, index) => 
              index === pc.usageHistory.length - 1 && !session.endTime
                ? { 
                    ...session, 
                    endTime: new Date(),
                    duration: Math.round((new Date() - session.startTime) / (1000 * 60)) // minutes
                  }
                : session
            );
            return {
              ...pc,
              status: 'available',
              currentUser: null,
              usageHistory: updatedHistory
            };
          }
          return pc;
        })
      };
      
    case ActionTypes.ADD_STUDENT:
      return {
        ...state,
        students: [...state.students, { ...action.payload, id: Date.now() }]
      };
      
    case ActionTypes.UPDATE_STUDENT:
      return {
        ...state,
        students: state.students.map(student => 
          student.id === action.payload.id ? { ...student, ...action.payload } : student
        )
      };
      
    case ActionTypes.REMOVE_STUDENT:
      return {
        ...state,
        students: state.students.filter(student => student.id !== action.payload)
      };
      
    case ActionTypes.JOIN_QUEUE:
      return {
        ...state,
        queue: [...state.queue, {
          id: Date.now(),
          studentId: action.payload.studentId,
          studentName: action.payload.studentName,
          queueTime: new Date(),
          requestedHours: action.payload.requestedHours,
          timeoutId: null
        }]
      };
      
    case ActionTypes.REMOVE_FROM_QUEUE:
      return {
        ...state,
        queue: state.queue.filter(item => item.id !== action.payload)
      };
      
    case ActionTypes.PROCESS_QUEUE:
      // Process first person in queue when PC becomes available
      if (state.queue.length > 0) {
        const firstInQueue = state.queue[0];
        const availablePc = state.pcs.find(pc => pc.status === 'available');
        
        if (availablePc) {
          // Set 2 minutes and 30 seconds timeout for sign-in
          const timeoutId = setTimeout(() => {
            // Move to end of queue if timeout
            // This would be handled by TIMEOUT_QUEUE_ITEM action
          }, 2.5 * 60 * 1000); // 2 minutes and 30 seconds
          
          return {
            ...state,
            queue: state.queue.map((item, index) => 
              index === 0 ? { ...item, timeoutId, notified: true } : item
            )
          };
        }
      }
      return state;
      
    case ActionTypes.TIMEOUT_QUEUE_ITEM:
      // Move timed-out user to end of queue
      const timedOutItem = state.queue.find(item => item.id === action.payload);
      if (timedOutItem) {
        const remainingQueue = state.queue.filter(item => item.id !== action.payload);
        return {
          ...state,
          queue: [...remainingQueue, { ...timedOutItem, timeoutId: null, notified: false }]
        };
      }
      return state;
      
      case ActionTypes.LOGIN:
        return {
          ...state,
          currentUser: action.payload.user,
          userType: action.payload.userType,
          token: action.payload.token, // MODIFICATION: Store the token in the state
        };
      
        case ActionTypes.LOGOUT:
          return {
            ...state,
            currentUser: null,
            userType: null,
            token: null, // MODIFICATION: Clear the token on logout
          };
      
    case ActionTypes.TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed
      };
      
    case ActionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };
      
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Context provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  
  // Load user data from localStorage on initialization
  useEffect(() => {
    const userData = localStorage.getItem('user_data');
    const token = localStorage.getItem('auth_token'); // MODIFICATION: Get the token
    
    // MODIFICATION: Check for both user data and a token
    if (userData && token) { 
      try {
        const data = JSON.parse(userData);
        
        if (data.user && data.userType) {
          dispatch({
            type: ActionTypes.LOGIN,
            payload: {
              user: data.user,
              userType: data.userType,
              token: token // MODIFICATION: Add token to the payload
            }
          });
        }
      } catch (error) {
        console.error('Error loading user data from localStorage:', error);
      }
    }
  }, []);
  
  // Auto-process queue when PCs become available (with dependency optimization)
  useEffect(() => {
    const availablePCs = state.pcs.filter(pc => pc.status === 'available').length;
    const queueLength = state.queue.length;
    
    if (availablePCs > 0 && queueLength > 0) {
      // Only dispatch if there's actually someone waiting to be processed
      const unprocessedInQueue = state.queue.filter(item => !item.notified).length;
      if (unprocessedInQueue > 0) {
        dispatch({ type: ActionTypes.PROCESS_QUEUE });
      }
    }
  }, [state.pcs.length, state.queue.length]); // Only depend on lengths, not full arrays
  
  return (
    <AppContext.Provider value={{ state, dispatch, ActionTypes }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;

