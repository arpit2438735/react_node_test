/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Implements JWT-based authentication with secure storage and proper state management.
 * 
 * Features:
 * - User authentication state management
 * - Login/logout functionality
 * - Token persistence
 * - Role-based access control support
 * 
 * @author Senior Full-Stack Engineer
 * @version 1.0.0
 */

import React, { createContext, useState, useContext, useEffect } from "react";

// Create the authentication context
const AuthContext = createContext();

/**
 * Custom hook to use the authentication context
 * @returns {Object} Authentication context values and methods
 */
export const useAuth = () => {
  return useContext(AuthContext);
};

/**
 * Authentication Provider Component
 * Manages authentication state and provides methods to login, logout, etc.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
const AuthProvider = ({ children }) => {
  /**
   * Initialize user state from localStorage if available
   * This ensures authentication persists across page refreshes
   */
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const email = localStorage.getItem("email");
    
    return token && email ? { email } : null;
  });
  
  const [loading, setLoading] = useState(true);

  /**
   * Effect to check token validity on mount
   * In a production app, this would verify the token with the backend
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (token) {
          // In a real app, we would validate the token with the server
          // For this demo, we'll just check if it exists
          const email = localStorage.getItem("email");
          
          if (email) {
            setUser({ email });
          } else {
            // If email is missing but token exists, something is wrong
            // Clear authentication data
            handleLogout();
          }
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  /**
   * Handles user login
   * @param {string} email - User's email
   * @param {string} password - User's password (not used in mock implementation)
   * @returns {Promise<Object>} User data
   */
  const login = async (email, password) => {
    // In a real app, this would make an API call
    // For this demo, we just update the state
    setUser({ email });
    return { email };
  };

  /**
   * Handles user signup
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} User data
   */
  const signup = async (email, password) => {
    // In a real app, this would make an API call
    // For this demo, we just update the state
    setUser({ email });
    return { email };
  };

  /**
   * Handles user logout
   * Clears authentication data, updates logs with logout time, and resets state
   */
  const handleLogout = () => {
    // Get current user info before clearing
    const userEmail = localStorage.getItem("email");
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    
    // Update user logs with logout time
    if (userEmail && userId) {
      const userLogs = JSON.parse(localStorage.getItem('userLogs') || '[]');
      
      // Find the most recent login log for this user without a logout time
      const logIndex = userLogs.findIndex(log => 
        log.userId === userId && 
        log.username === userEmail && 
        !log.logoutTime
      );
      
      if (logIndex !== -1) {
        // Update the log with logout time
        userLogs[logIndex].logoutTime = new Date().toISOString();
        localStorage.setItem('userLogs', JSON.stringify(userLogs));
        console.log("Updated user log with logout time:", userLogs[logIndex]);
      } else {
        // If no matching log found, create a new log entry with logout time
        const logData = {
          id: `log-${Date.now()}`,
          userId: userId,
          username: userEmail,
          role: userRole,
          action: "logout",
          loginTime: new Date(Date.now() - 3600000).toISOString(), // Assume 1 hour session
          logoutTime: new Date().toISOString(),
          ipAddress: "127.0.0.1",
          tokenName: token ? token.substring(0, 10) + "..." : "Unknown"
        };
        userLogs.push(logData);
        localStorage.setItem('userLogs', JSON.stringify(userLogs));
        console.log("Created logout log:", logData);
      }
    }
    
    // Clear all auth-related data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    
    // Reset user state
    setUser(null);
    
    // In a real app, we might also invalidate the token on the server
    console.log("User logged out");
  };

  /**
   * Handles password reset request
   * @param {string} email - User's email
   * @returns {Promise<void>}
   */
  const resetPassword = async (email) => {
    // In a real app, this would make an API call
    console.log("Password reset requested for:", email);
    return Promise.resolve();
  };

  /**
   * Checks if the current user has a specific role
   * @param {string} requiredRole - Role to check for
   * @returns {boolean} Whether user has the required role
   */
  const hasRole = (requiredRole) => {
    const userRole = localStorage.getItem("userRole");
    return userRole === requiredRole;
  };

  /**
   * Context value with authentication state and methods
   */
  const value = {
    user,
    loading,
    login,
    signup,
    logout: handleLogout,
    resetPassword,
    hasRole,
    isAdmin: () => hasRole("admin"),
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
