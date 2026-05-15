import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";

const telerisonApi = import.meta.env.VITE_TELERISON_API;
type User = {
  id: number;
  name: string;
  email: string;
};

type AuthContext = {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<["ok", null] | [null, Error]>;
  logout: () => void;
  getRequestHeader: () => string;
};

const AuthContext = createContext<AuthContext | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authToken = token || localStorage.getItem("token");
    authenticate(authToken);
  }, [token]);

  async function authenticate(token: string | null) {
    if (!token) {
      setLoading(false);
      return false;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${telerisonApi}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = res.data;
      setUser(data.user);
      setToken(token);
      window.localStorage.setItem("token", token);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
      return false;
    }
  }

  async function login(
    email: string,
    password: string,
  ): Promise<["ok", null] | [null, Error]> {
    setLoading(true);
    try {
      const res = await axios.post(`${telerisonApi}/login`, {
        email,
        password,
      });
      const data = res.data;
      setToken(data.token);
      setLoading(false);
      return ["ok", null];
    } catch (error) {
      console.error(error);
      setLoading(false);
      return [null, error as Error];
    }
  }

  async function logout() {
    window.localStorage.removeItem("token");
    setUser(null);
    setToken(null);
    return;
  }

  const getRequestHeader = () => {
    return `Bearer ${token}`;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, getRequestHeader }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("UseAuth must be called within a Auth provider");
  }

  return ctx;
}

export { useAuth, AuthProvider };
