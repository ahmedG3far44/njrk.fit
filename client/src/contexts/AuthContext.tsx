import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type User, type LoginCredentials, type RegisterData, type AuthResponse } from '../services/auth'
import { api } from '../lib/fetchApi'


const API_URL = import.meta.env.VITE_API_URL as string;

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  getCurrentUser: () => Promise<void>
  login: (credentials: LoginCredentials) => Promise<AuthResponse>
  register: (userData: RegisterData) => Promise<AuthResponse>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}



export const AuthProvider = ({ children }: { children: ReactNode }) => {

  const [user, setUser] = useState<User | null>(JSON.parse(localStorage.getItem("user")!))
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(user ? true : false)
  const [isLoading, setIsLoading] = useState<boolean>(false)


  const getCurrentUser = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/users/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        }
      });
      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }

      const data = await res.json();
      console.log("current user", data.user);
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setIsAuthenticated(true);
      return data;

    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const data = await api.post<AuthResponse>("/auth/login", credentials);
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }
  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      const data = await api.post<AuthResponse>("/auth/register", userData);
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }
  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post("/auth/logout", {});
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("user");
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }
  useEffect(() => {

    getCurrentUser();


  }, [])

  return <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, register, logout, getCurrentUser }}>{children}</AuthContext.Provider>
}